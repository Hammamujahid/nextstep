package model

// Assignee adalah info ringkas user yang di-assign ke sebuah resource
// (task, project, goal, job application). Disertakan di respons list agar
// frontend bisa menampilkan nama tanpa request tambahan.
type Assignee struct {
	ID       int    `json:"id" db:"id"`
	Username string `json:"username" db:"username"`
	Email    string `json:"email" db:"email"`
}

// AssignableMember adalah anggota workspace yang boleh di-assign ke sebuah
// resource: permission-nya selain none (admin selalu editor).
type AssignableMember struct {
	UserID     int    `json:"user_id" db:"user_id"`
	Username   string `json:"username" db:"username"`
	Email      string `json:"email" db:"email"`
	MemberRole string `json:"member_role" db:"member_role"`
	Permission string `json:"permission"`
}
