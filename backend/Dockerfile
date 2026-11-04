FROM rust:1-bookworm AS build
WORKDIR /app
COPY Cargo.toml ./
COPY src ./src
COPY migrations ./migrations
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=build /app/target/release/firescrum-backend /usr/local/bin/
EXPOSE 8080
CMD ["firescrum-backend"]
