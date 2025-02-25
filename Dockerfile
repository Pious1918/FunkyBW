
# base image
FROM node:22.3-alpine 


# set the working directory inside the container
WORKDIR /app

# copies files and instructions from the host machine to the container
COPY . .

# installing all the dependencies inside the image
RUN npm install --platform=linuxmusl --arch=x64 --libc=musl

EXPOSE 3000


# in cmd refers the  default command to run when starting a container from this image
# CMD ["npm", "start"]
CMD ["npm", "start"]
