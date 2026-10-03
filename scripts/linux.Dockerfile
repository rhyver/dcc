FROM oven/bun:1.3.13 AS bun
FROM electronuserland/builder:20@sha256:4771aae3cd4b606e9e79f9adb0b463c361dd1dee80133fe9ce527b5eb241749c
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
