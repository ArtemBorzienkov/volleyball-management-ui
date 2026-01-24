FROM node:20

# Create app directory
WORKDIR /usr/app

# Accept build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_HOST_URL
ENV NEXT_PUBLIC_HOST_URL=$NEXT_PUBLIC_HOST_URL

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Build the Next.js app (NEXT_PUBLIC_* vars are embedded at build time)
RUN npm run build

EXPOSE 8080
CMD [ "npm", "run", "start" ]
