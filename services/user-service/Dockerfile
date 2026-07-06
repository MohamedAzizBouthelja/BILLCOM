# Stage 1: Build
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Run
FROM python:3.11-slim AS runner

WORKDIR /app

# Applique les derniers correctifs de sécurité Debian disponibles au moment du
# build, indépendamment de la date de gel de l'image de base python:3.11-slim.
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

# Création d'un groupe et d'un utilisateur non-root pour la sécurité
RUN groupadd -g 1000 appgroup && \
    useradd -u 1000 -g appgroup -m -s /bin/bash appuser

# Copie des packages installés dans le stage de build avec le bon propriétaire
COPY --chown=appuser:appgroup --from=builder /root/.local /home/appuser/.local
COPY . .


# Configuration des variables d'environnement
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PORT=8001

# Attribution des permissions de dossiers à l'utilisateur non-root
RUN chown -R appuser:appgroup /app && chmod +x /app/start.sh

USER appuser

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8001/health', timeout=3)" || exit 1

CMD ["bash", "start.sh"]
