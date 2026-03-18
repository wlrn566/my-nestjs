# 1단계: 빌드 스테이지
FROM node:22-alpine AS builder

WORKDIR /app

# 의존성 설치 (캐시 활용을 위해 먼저 복사)
COPY package*.json ./
RUN npm ci

# 소스 복사 및 빌드 (TypeScript -> JavaScript)
COPY . .
RUN npm run build

# 2단계: 실행 스테이지 (용량 다이어트)
FROM node:22-alpine

WORKDIR /app

# 빌드 결과물과 실행에 필요한 라이브러리만 가져오기
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 4445

# 운영 모드로 실행
CMD ["node", "dist/main"]