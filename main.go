package main

import (
    "log"
	"fmt"
    "gopkg.in/toast.v1"
)

func main() {
    notification := toast.Notification{
        AppID: "Example App",
        Title: "My notification",
        Message: "Some message about how important something is...",
        Icon: "go.png", // This file must exist (remove this line if it doesn't)
        Actions: []toast.Action{
            {"protocol", "I'm a button", ""},
            {"protocol", "Me too!", ""},
        },
    }
	fmt.Println("Hello, world!")
    err := notification.Push()
    if err != nil {
        log.Fatalln(err)
    }
}