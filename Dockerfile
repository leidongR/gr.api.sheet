FROM node:lts-fermium as intermediate

WORKDIR /gr.api.sheet

ADD package.json yarn.lock ./

RUN yarn

COPY . .

RUN yarn run build

FROM node:lts-fermium
WORKDIR /gr.api.sheet

COPY --from=intermediate /gr.api.sheet/dist /gr.api.sheet/dist
COPY --from=intermediate /gr.api.sheet/tsconfig-paths-bootstrap.js /gr.api.sheet/tsconfig-paths-bootstrap.js
COPY --from=intermediate /gr.api.sheet/tsconfig.json /gr.api.sheet/tsconfig.json
COPY --from=intermediate /gr.api.sheet/node_modules /gr.api.sheet/node_modules
COPY --from=intermediate /gr.api.sheet/entrypoint /gr.api.sheet/entrypoint
COPY --from=intermediate /gr.api.sheet/config /gr.api.sheet/config
COPY --from=intermediate /gr.api.sheet/test_files/us-stock-holiday.xlsx /gr.api.sheet/test_files/test.xlsx

CMD ["./entrypoint"]
EXPOSE 5208
