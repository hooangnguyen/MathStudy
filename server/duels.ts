import { Router } from "express";
import { FieldValue, type Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import { handle, HttpError } from "./http";
import { calculateLPChange, getRankTier } from "../shared/rank";
import { DUEL_DURATION_SECONDS, clampDuelScore, decideDuelOutcome } from "../shared/duel";

export const duelsRouter = Router();

// Cho phép lệch đồng hồ nhỏ giữa client và server khi hết giờ
const END_TOLERANCE_SECONDS = 5;

type PlayerResult = { outcome: "win" | "lose" | "draw"; lpChange: number; myScore: number; opponentScore: number };

/**
 * Kết thúc trận đấu nhanh và tính LP cho cả hai người chơi.
 * Idempotent: gọi lại (bởi người chơi còn lại hoặc do retry) trả về kết quả đã lưu.
 * Body `{ surrender: true }` để đầu hàng.
 */
duelsRouter.post(
  "/:duelId/finish",
  handle(async (req, res) => {
    const uid = req.uid!;
    const surrender = req.body?.surrender === true;
    const duelRef = adminDb.doc(`activeDuels/${req.params.duelId}`);

    const result = await adminDb.runTransaction(async (tx): Promise<PlayerResult> => {
      const duelDoc = await tx.get(duelRef);
      if (!duelDoc.exists) throw new HttpError(404, "Trận đấu không tồn tại");
      const duel = duelDoc.data()!;
      const { player1Id, player2Id } = duel;
      if (uid !== player1Id && uid !== player2Id) throw new HttpError(403, "Bạn không tham gia trận này");

      if (duel.result) return resultFor(uid, duel.result);

      const startedAt: Timestamp | undefined = duel.startedAt;
      const elapsed = startedAt ? (Date.now() - startedAt.toMillis()) / 1000 : 0;
      const surrenderedBy: string | null = duel.surrenderedBy || (surrender ? uid : null);
      const bothFinished = duel.player1TimeLeftAtFinish != null && duel.player2TimeLeftAtFinish != null;
      const timeUp = elapsed >= DUEL_DURATION_SECONDS - END_TOLERANCE_SECONDS;
      if (!surrenderedBy && !bothFinished && !timeUp) {
        throw new HttpError(409, "Trận đấu chưa kết thúc");
      }

      const cappedElapsed = Math.min(elapsed, DUEL_DURATION_SECONDS + 30);
      const score1 = clampDuelScore(duel.player1Score, duel.player1Progress, cappedElapsed);
      const score2 = clampDuelScore(duel.player2Score, duel.player2Progress, cappedElapsed);
      const { winnerId, isDraw } = decideDuelOutcome(player1Id, player2Id, score1, score2, surrenderedBy);

      const rankRefs = [player1Id, player2Id].map((id: string) => adminDb.doc(`userRanks/${id}`));
      const userRefs = [player1Id, player2Id].map((id: string) => adminDb.doc(`users/${id}`));
      const [rank1, rank2, user1, user2] = await Promise.all([...rankRefs, ...userRefs].map((r) => tx.get(r)));
      const lp1 = rank1.data()?.lp ?? 0;
      const lp2 = rank2.data()?.lp ?? 0;

      let change1: number;
      let change2: number;
      if (isDraw) {
        change1 = change2 = calculateLPChange(lp1, lp2, true);
      } else {
        const p1Won = winnerId === player1Id;
        const gain = p1Won ? calculateLPChange(lp1, lp2, false) : calculateLPChange(lp2, lp1, false);
        const loss = -Math.round(gain * 0.75);
        change1 = p1Won ? gain : loss;
        change2 = p1Won ? loss : gain;
      }

      const writeRank = (rankDoc: DocumentSnapshot, userDoc: DocumentSnapshot, id: string, change: number) => {
        const prev = rankDoc.data() || {};
        const user = userDoc.data() || {};
        const won = winnerId === id;
        const lost = !isDraw && !won;
        const lp = Math.max(0, (prev.lp ?? 0) + change);
        const streak = won ? (prev.streak ?? 0) + 1 : 0;
        tx.set(rankDoc.ref, {
          uid: id,
          username: user.name || prev.username || "Người chơi",
          lp,
          rankTier: getRankTier(lp),
          wins: (prev.wins ?? 0) + (won ? 1 : 0),
          losses: (prev.losses ?? 0) + (lost ? 1 : 0),
          draws: (prev.draws ?? 0) + (isDraw ? 1 : 0),
          streak,
          maxStreak: Math.max(prev.maxStreak ?? 0, streak),
          ...(user.grade !== undefined && { grade: user.grade }),
          ...(user.avatar && { avatar: user.avatar }),
        });
      };
      writeRank(rank1, user1, player1Id, change1);
      writeRank(rank2, user2, player2Id, change2);

      const stored = { winnerId, isDraw, player1Id, player2Id, score1, score2, change1, change2, surrenderedBy };
      tx.update(duelRef, {
        status: "finished",
        finishedAt: FieldValue.serverTimestamp(),
        ...(surrenderedBy && { surrenderedBy }),
        result: stored,
      });
      tx.set(adminDb.doc(`duelMatches/${duelRef.id}`), {
        id: duelRef.id,
        roomId: duelRef.id,
        player1Id,
        player1Name: duel.player1Name ?? "",
        player2Id,
        player2Name: duel.player2Name ?? "",
        player1Score: score1,
        player2Score: score2,
        winnerId,
        isDraw,
        lpChange: change1, // theo góc nhìn player1 (dữ liệu cũ)
        lpChanges: { [player1Id]: change1, [player2Id]: change2 },
        gameMode: duel.gameMode || "quick",
        createdAt: FieldValue.serverTimestamp(),
      });

      return resultFor(uid, stored);
    });

    res.json({ success: true, ...result });
  })
);

function resultFor(uid: string, r: any): PlayerResult {
  const isP1 = uid === r.player1Id;
  return {
    outcome: r.isDraw ? "draw" : r.winnerId === uid ? "win" : "lose",
    lpChange: isP1 ? r.change1 : r.change2,
    myScore: isP1 ? r.score1 : r.score2,
    opponentScore: isP1 ? r.score2 : r.score1,
  };
}
