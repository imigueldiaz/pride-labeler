# Pride Labeler for Bluesky

A comprehensive LGBTQIA+ self-labeling service for Bluesky Social, including asexual and aromantic spectrums.

## 🌈 Available Labels

### Sexual Orientations
- Lesbian 🏳️‍🌈
- Gay 🏳️‍🌈
- Bisexual 💗💜💙
- Pansexual 💗💛💙

### Gender Identities
- Trans 🏳️‍⚧️
- Non-Binary 🏳️‍⚧️
- Agender 🏳️‍⚧️
- Intersex ⚧

### Asexual Spectrum
- Asexual 🖤🤍💜
- Demisexual 🖤💜
- Graysexual 🖤
- Aceflux 💜

### Aromantic Spectrum
- Aromantic 💚🤍🖤
- Demiromantic 💚
- Grayromantic 🖤💚
- Aroflux 💚

## 🚀 How to Use

1. Visit [@pride-labels.bsky.social](https://bsky.app/profile/pride-labels.bsky.social) on Bluesky
2. Find the post with the label you want to use
3. Like the post to apply the label to your profile
4. To remove all labels, like the DELETE post

## 💻 Development

### Prerequisites
- Node.js 21+
- npm

### Setup
1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/pride-labeler.git
cd pride-labeler
```

2. Install dependencies
```bash
npm install
```

3. Create .env file
```env
DID=your_did
SIGNING_KEY=your_signing_key
BSKY_IDENTIFIER=your_identifier
BSKY_PASSWORD=your_password
PORT=4100
METRICS_PORT=4102
FIREHOSE_URL=wss://jetstream1.us-east.bsky.network/subscribe
CURSOR_UPDATE_INTERVAL=10000
```

4. Run the server
```bash
npm run start
```

## 🌟 Features
- Comprehensive LGBTQIA+ identity labels
- Full asexual and aromantic spectrum support
- Bilingual support (English/Spanish)
- No limit on number of labels per user
- Easy self-service label application

## 📝 License
MIT

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 💖 Credits
Based on the [Bluesky Labeler Starter Kit](https://github.com/ORIGINAL_REPO)
