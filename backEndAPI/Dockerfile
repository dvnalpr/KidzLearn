FROM node:22.11.0
WORKDIR /usr/src/app
ENV PORT 3000
ENV GCP_PROJECT_ID=kidzlearn-project
COPY . .
RUN npm install
EXPOSE 3000
CMD [ "npm", "run", "start" ]