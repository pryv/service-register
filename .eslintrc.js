module.exports = {
    "parser": "babel-eslint",
    "plugins": [
      "flowtype"
    ],
    "env": {
        "es6": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:flowtype/recommended"
    ],
    "parserOptions": {
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "warn",
            2, 
            { "VariableDeclarator": { "var": 2, "let": 2, "const": 3 } },
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};