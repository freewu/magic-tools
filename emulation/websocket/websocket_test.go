package main

import (
	"github.com/gorilla/websocket"
	"log"
	"testing"
)

func TestWebSocket(t *testing.T) {
	// 连接WebSocket服务器
	conn, _, err := websocket.DefaultDialer.Dial("ws://localhost:8086/ws", nil)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	// 发送消息
	err = conn.WriteMessage(websocket.TextMessage, []byte("Hello, world!"))
	if err != nil {
		log.Fatal("conn.WriteMessage error: " + err.Error())
	}

	// 读取消息
	messageType, p, err := conn.ReadMessage()
	if err != nil {
		log.Fatal("conn.ReadMessage error: " + err.Error())
	}
	log.Printf("messageType: %v\n", messageType)
	log.Printf("Received message: %v\n", string(p))

	err = conn.Close()
	if err != nil {
		log.Fatal("conn.Close error: " + err.Error())
	}
}

func TestWebSocketPing(t *testing.T) {
	// 连接WebSocket服务器
	conn, _, err := websocket.DefaultDialer.Dial("ws://localhost:8086/ws", nil)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	// 发送消息
	err = conn.WriteMessage(websocket.PingMessage, []byte("ping"))
	if err != nil {
		log.Fatal("conn.WriteMessage error: " + err.Error())
	}

	// 读取消息
	messageType, p, err := conn.ReadMessage()
	if err != nil {
		log.Fatal("conn.ReadMessage error: " + err.Error())
	}
	log.Printf("messageType: %v\n", messageType)
	log.Printf("Received message: %v\n", string(p))
}

func TestWebSocketPong(t *testing.T) {
	// 连接WebSocket服务器
	conn, _, err := websocket.DefaultDialer.Dial("ws://localhost:8086/ws", nil)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	// 发送消息
	err = conn.WriteMessage(websocket.PongMessage, []byte("pong"))
	if err != nil {
		log.Fatal("conn.WriteMessage error: " + err.Error())
	}

	// 读取消息
	messageType, p, err := conn.ReadMessage()
	if err != nil {
		log.Fatal("conn.ReadMessage error: " + err.Error())
	}
	log.Printf("messageType: %v\n", messageType)
	log.Printf("Received message: %v\n", string(p))

	conn.
}
