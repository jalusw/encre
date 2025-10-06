# Encre

Encre is minimal note taking web app that allows you to take note with markdown
formatting. The web app has offline capabilities and stores your notes in the local storage
which allows you to open it and write notes without an internet connection.

The app is built with vanilla js and web capabilities such as service & web workers.
to store the notes this app leverages sqlite's web assembly to store the notes through origin private file system.

Features:

- Markdown formatting
- Offline capabilities
- (Dark/Light) Theme support

## Getting Started

**Prerequisites**

- node.js (v20.11.0)
- pnpm (v9.15.0)

**Running on your local computer**

1. Clone the repository

```bash
git  clone https://github.com/jalusw/encre.git
```

2. Install the dependencies

```bash
pnpm i  # use any package manager you'd like
```

3. Build the application

```bash
pnpm build
```

4. Start the http server

```
pnpm preview
```

## License

This project is licensed under the [GNU General Public License V3](LICENSE.md)
