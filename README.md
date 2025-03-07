# Todo Track - VS Code Extension

## 📌 Overview
Todo Track is a powerful VS Code extension that helps developers keep track of important comments like TODO, FIXME, and many more. It scans project files, organizes comments in a tree view, and allows full customization of comment types and file types to scan.

## ✨ Features
- 📂 **Tree View**: Displays TODO, FIXME, and other tagged comments in a structured tree view.
- 🎯 **Customizable comments**: Users can define their own comment tags in `.todo.json`.
- 🔍 **File Type Control**: Specify which file types should be scanned.
- 📄 **Auto-Scanning**: Automatically updates the tree view when files are modified and saved.
- 📝 **Quick Navigation**: Click on any comment in the tree view to jump to the exact location in the code.
- 🚀 **Efficient Scanning**: Ignores `node_modules` and non-specified files for optimal performance.

## 📥 Installation
1. Open VS Code and go to the Extensions Marketplace.
2. Search for **Todo Track**.
3. Click **Install** and restart VS Code if necessary.

## ⚙️ Configuration
Upon first use, a `.todo.json` file will be automatically created in your workspace root. You can customize the following:

```json
{
  "commentTypes": ["TODO", "FIXME", "OPTIMIZE", "REFACTOR", "REVIEW", "DEBUG", "NOTE", "DEPRECATED"],
  "fileTypes": ["js", "jsx", "ts", "tsx", "html", "css", "scss", "json", "py", "java", "dart", "php", "rb", "cs", "go", "rs"]
}
```

### Modifying comments
To track additional comments, simply add them to the `commentsTypes` array.

### Controlling File Types
To limit scanning to specific file types, update the `fileTypes` array.

## 🛠 Usage
- **View Comment Tags**: Open the Todo Track panel from the activity bar.
- **Navigate to Code**: Click any entry in the tree view to jump directly to the comment.
- **Refresh Manually**: Click the refresh button in the view if needed.

## 🚀 Commands
| Command | Description |
|---------|-------------|
| `todo-track.refresh` | Refresh the scanned comments |
| `todo-track.openFileAtLine` | Open file at the specified comment line |

## 📝 License
MIT License

---

Made for developers who love clean and structured workflows! 🚀

