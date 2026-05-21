# ============================================================
# Dockerfile - Atracciones Frontend (Paula Coronel)
# Servidor web estático NGINX
# ============================================================

FROM nginx:alpine

# Copiar archivos estáticos al directorio público de NGINX
COPY . /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
