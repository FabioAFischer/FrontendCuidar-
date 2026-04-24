FROM node:22-alpine AS build

WORKDIR /app

# Clona diretamente a develop
RUN apk add --no-cache git
RUN git clone -b develop https://github.com/FabioAFischer/FrontendCuidar-.git .

RUN npm install
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]