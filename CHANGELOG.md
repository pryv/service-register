# API change log

## 1.2.X

- By adding a 'certificateAuthorityAuthorization' section in your configuration 
  file, you can now configure CAA records (certificate authority authorisation).

- Fix DNS vulnerability 2018022101: DNS does not answer to DNS replies anymore.

- Fix DNS vulnerability 2018022102: DNS now explicitely advertise that it is not recursive.

- Remove 2 optional unused services (ssh and cron) from our docker image.
