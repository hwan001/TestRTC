# 🔧 Build Stage
FROM maven:3.8.7-eclipse-temurin-17 AS build

WORKDIR /app

# 의존성 캐싱
COPY pom.xml .
RUN mvn dependency:go-offline

# 소스 복사 및 빌드
COPY src ./src
RUN mvn clean package -DskipTests

# 🏃 Runtime Stage
FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]