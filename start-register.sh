cd source
authbind node app.js \
    --http.static.port 80 --http.static.ip 91.121.41.240  --http.static.name rec.la \
    --http.register.port 443 --http.register.ip 91.121.41.240  --http.register.name rec.la --http.register.ssl true \
    --dns.port 53 --dns.ip 91.121.41.240 --dns.hostname ns1.wactiv.com
