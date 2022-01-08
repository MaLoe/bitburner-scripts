# my scripts for the bitburner game

## dev environment

### VS Code:

1. Bitburner's typescript declarations
    - get [NetscriptDefinitions.d.ts](https://github.com/danielyxie/bitburner/blob/master/src/ScriptEditor/NetscriptDefinitions.d.ts)
    - rename it to globals.d.ts and put it into the base direcory
    - remove every "export " from globals.d.ts, otherwise it's a module and needs to be explicedly imported
2. tsconfig.json
    - getting import paths working with "/lib" etc
        > "baseUrl": "./scripts",  
        > "paths": {"/*": ["*"]},  
    - handle javascript
        > "allowJs": true,  
        > "checkJs": true,  
    - we want only intellisense/checks, no compilation
        > "noEmmit": true,  