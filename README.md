# Claude Forge

Claude Forge is a VS Code extension that allows you to interact with your Claude.ai projects directly from your IDE.

## Features

- List your Claude.ai projects

## Installation

1. Install the Claude Forge extension from the VS Code marketplace.
2. After installation, you need to set up your Claude.ai cookies for authentication.

## Setting Up Authentication

This extension requires you to manually provide your Claude.ai session cookies. Here's how to do it:

1. Go to [Claude.ai](https://claude.ai) and log in to your account.
2. Open your browser's developer tools (usually F12 or right-click and select "Inspect").
3. Go to the "Network" tab.
4. Refresh the page.
5. Look for a request to "claude.ai" in the network tab.
6. Click on this request and find the "Request Headers" section.
7. Find the "Cookie" header and copy its entire value.
8. In VS Code, go to Settings (File > Preferences > Settings).
9. Search for "Claude Forge" in the settings search bar.
10. Paste your copied cookie string into the "Cookie string for Claude authentication" field.

## Usage

After setting up your cookies, you can use the extension as follows:

1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on Mac).
2. Type "Claude Forge: List Projects" and select it.
3. The extension will fetch and display your Claude.ai projects.

## Troubleshooting

If you encounter any issues:

1. Make sure your cookie is correctly set in the extension settings.
2. Your session might have expired. Try logging out and back in to Claude.ai, then update your cookie in the VS Code settings.
3. Ensure you've copied the entire cookie string, including all key-value pairs.

## Privacy and Security

This extension stores your Claude.ai session cookie locally on your machine. Never share this cookie with anyone, as it provides access to your Claude.ai account. The extension does not send this data anywhere except to Claude.ai for authentication purposes.

## Feedback and Contributions

If you encounter any issues or have suggestions for improvements, please file an issue on our GitHub repository. Contributions are welcome!