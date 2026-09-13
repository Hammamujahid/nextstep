package model

import "time"

type UserDocument struct {
	ID           int       `json:"id" db:"id"`
	UserId       int       `json:"user_id" db:"user_id"`
	DocumentName string    `json:"document_name" db:"document_name"`
	DocumentURL  string    `json:"document_url" db:"document_url"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}
