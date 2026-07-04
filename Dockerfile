# Stage 1: Build Frontend
FROM node:20-alpine AS builder

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy các file quản lý thư viện
COPY package*.json ./

# Cài đặt toàn bộ dependencies (bao gồm devDependencies để build Vite)
RUN npm ci

# Copy toàn bộ mã nguồn
COPY . .

# Build frontend thành các file tĩnh (đưa vào thư mục dist/)
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner

WORKDIR /app

# Đặt môi trường production
ENV NODE_ENV=production
ENV PORT=3000

# Copy package.json và package-lock.json
COPY package*.json ./

# Chỉ cài đặt các thư viện cần thiết cho production
RUN npm ci --omit=dev

# Copy thư mục dist (chứa bản build của frontend) từ Stage 1
COPY --from=builder /app/dist ./dist

# Copy file server chạy backend
COPY server.ts ./
COPY tsconfig.json ./

# Mở port 3000
EXPOSE 3000

# Lệnh khởi chạy server (dùng cross-env tsx server.ts theo package.json)
CMD ["npm", "start"]
