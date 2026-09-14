package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	googleAuthURL     = "https://accounts.google.com/o/oauth2/v2/auth"
	googleTokenURL    = "https://oauth2.googleapis.com/token"
	googleUserinfoURL = "https://www.googleapis.com/oauth2/v2/userinfo"
)

// GoogleOAuth menangani Authorization Code Flow ke Google.
// Tidak memakai library OAuth eksternal, cukup net/http standar.
type GoogleOAuth struct {
	clientID     string
	clientSecret string
	redirectURL  string
	httpClient   *http.Client
}

func NewGoogleOAuth(clientID, clientSecret, redirectURL string) *GoogleOAuth {
	return &GoogleOAuth{
		clientID:     clientID,
		clientSecret: clientSecret,
		redirectURL:  redirectURL,
		httpClient:   &http.Client{Timeout: 10 * time.Second},
	}
}

// AuthCodeURL membangun URL consent screen Google.
func (g *GoogleOAuth) AuthCodeURL(state string) string {
	q := url.Values{}
	q.Set("client_id", g.clientID)
	q.Set("redirect_uri", g.redirectURL)
	q.Set("response_type", "code")
	q.Set("scope", "openid email profile")
	q.Set("state", state)
	q.Set("access_type", "online")
	q.Set("prompt", "select_account")
	return googleAuthURL + "?" + q.Encode()
}

type GoogleUserinfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

// ExchangeCode menukar authorization code dengan access token.
func (g *GoogleOAuth) ExchangeCode(
	ctx context.Context,
	code string,
) (string, error) {
	form := url.Values{}
	form.Set("code", code)
	form.Set("client_id", g.clientID)
	form.Set("client_secret", g.clientSecret)
	form.Set("redirect_uri", g.redirectURL)
	form.Set("grant_type", "authorization_code")

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		googleTokenURL,
		strings.NewReader(form.Encode()),
	)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var body struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return "", err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 || body.AccessToken == "" {
		if body.Error == "" {
			body.Error = resp.Status
		}
		return "", fmt.Errorf("google token exchange failed: %s", body.Error)
	}

	return body.AccessToken, nil
}

// FetchUserinfo mengambil profil user dari Google memakai access token.
func (g *GoogleOAuth) FetchUserinfo(
	ctx context.Context,
	accessToken string,
) (*GoogleUserinfo, error) {
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		googleUserinfoURL,
		nil,
	)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("google userinfo failed: %s", resp.Status)
	}

	var info GoogleUserinfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}
	if info.ID == "" || info.Email == "" {
		return nil, fmt.Errorf("google userinfo incomplete")
	}

	return &info, nil
}
