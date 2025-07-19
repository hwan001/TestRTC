package com.example.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class SignalingHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    private final Map<String, String> sessionIdToUser = new ConcurrentHashMap<>();
    ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Map<String, Object> json = objectMapper.readValue(message.getPayload(), Map.class);
        String type = (String) json.get("type");
        String from = (String) json.get("from");
        String to = (String) json.get("to");

        if ("join".equals(type)) {
            userSessions.put(from, session);
            sessionIdToUser.put(session.getId(), from);
            log.info("👤 {} joined", from);
        } else if (to != null && userSessions.containsKey(to)) {
            WebSocketSession targetSession = userSessions.get(to);
            if (targetSession.isOpen()) {
                targetSession.sendMessage(new TextMessage(message.getPayload()));
                log.info("📤 Relayed {} from {} to {}", type, from, to);
            }
        } else {
            log.warn("⚠️ Cannot route message: to={} not connected", to);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("📨 Connection close : {}", session.getId());
        userSessions.remove(session.getId());
    }
}