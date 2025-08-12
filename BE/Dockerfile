# 🔧 Build Stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /src

COPY pom.xml .
RUN mvn -q -B -DskipTests dependency:go-offline

COPY src ./src
# repackage까지 보장 (플러그인 설정에 따라 package만으로도 생성될 수 있으나 안전하게)
RUN mvn -q -B -DskipTests package spring-boot:repackage

# layertools 동작 확인 및 레이어 추출
RUN set -eux; \
    JAR="$(ls target/*.jar | head -n1)"; \
    echo "Using JAR=$JAR"; \
    java -Djarmode=layertools -jar "$JAR" list; \
    mkdir -p /layers; \
    java -Djarmode=layertools -jar "$JAR" extract --destination /layers; \
    echo "Extracted layers:"; \
    find /layers -maxdepth 2 -type d -print

# 🏃 Runtime Stage
FROM eclipse-temurin:17-jre
WORKDIR /app

# 레이어 별도 COPY (여기서 경로가 반드시 존재해야 함)
COPY --from=build /layers/dependencies/          /app/
COPY --from=build /layers/snapshot-dependencies/ /app/
COPY --from=build /layers/spring-boot-loader/    /app/
COPY --from=build /layers/application/           /app/

EXPOSE 8080
ENTRYPOINT ["java","org.springframework.boot.loader.JarLauncher"]
