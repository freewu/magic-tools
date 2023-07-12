package main

// https://juejin.cn/post/7208946311885832252

import (
	"fmt"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func main() {
	// 创建HTTP服务器
	http.HandleFunc("/ws", handleWebSocket)
	log.Println("Server started on :8086")
	log.Fatal(http.ListenAndServe(":8086", nil))
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// 升级 HTTP 连接为 WebSocket 连接
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	fmt.Printf("RemoteAddr: %v\n", conn.RemoteAddr())
	fmt.Printf("LocalAddr: %v\n", conn.LocalAddr())

	// 处理客户端关闭信息
	conn.SetCloseHandler(func(code int, text string) error {
		fmt.Printf("closed remote: %v code: %v text: %v\n ", conn.RemoteAddr(), code, text)
		//fmt.Printf("closed code: %v text: %v\n ", code, text)
		return nil
	})
	// 处理 ping 信息
	conn.SetPingHandler(func(data string) error {
		fmt.Printf("ping remote: %v data: %v\n ", conn.RemoteAddr(), data)
		//fmt.Printf("ping data: %v\n ", data)
		return nil
	})
	// 处理 ping 信息
	conn.SetPongHandler(func(data string) error {
		fmt.Printf("pong remote: %v data: %v\n ", conn.RemoteAddr(), data)
		//tfmt.Printf("pong data: %v\n ", data)
		return nil
	})

	// 处理WebSocket连接
	for {
		// messageType 消息类型
		// 1 文本消息  TextMessage   2 二进制消息 BinaryMessage 8 CloseMessage 9 PingMessage 10 PongMessage
		// 读取消息
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Printf("server conn.ReadMessage error: %v\n", err)
			return
		}
		log.Println("Received message:", string(p))

		// 发送消息
		//err = conn.WriteMessage(messageType, []byte("Hello, world!"))
		err = conn.WriteMessage(messageType, p)
		if err != nil {
			log.Printf("server conn.WriteMessage error: %v\n", err)
			return
		}
	}
}
