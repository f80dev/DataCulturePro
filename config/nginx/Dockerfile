#docker build -t f80hub/nginx-openalumni ./nginx && docker push f80hub/nginx-openalumni
#docker rm -f nginx-openalumni && docker pull f80hub/nginx-openalumni:latest && docker run --name nginx-openalumni -p 80:80  --restart=always -ti f80hub/nginx-openalumni:latest

FROM nginx:1.19.0-alpine
RUN rm /etc/nginx/conf.d/default.conf
ADD nginx.conf /etc/nginx/nginx.conf

#Installation des certificats
RUN mkdir /root/certs
WORKDIR /root/certs
COPY ../../certs .
