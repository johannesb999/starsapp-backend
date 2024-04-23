# Verwende das offizielle Node 21-Image als Basis
FROM node:21

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere die package.json und package-lock.json (falls vorhanden) in das Arbeitsverzeichnis
COPY package*.json ./

# Installiere die Projektabhängigkeiten
RUN npm install

# Kopiere den restlichen Quellcode des Projekts in das Arbeitsverzeichnis
COPY . .

# Dein Service nutzt Port 3000, also lege diesen Port im Docker-Image offen
EXPOSE 3001

# Definiere den Befehl zum Starten der Anwendung
CMD [ "node", "index.js" ]