# Debugging - Testes para Multiplayer

## Passos para testar e debug:

1. **Limpe o cache do navegador (Ctrl+Shift+Delete)** e feche todas as abas

2. **Inicie o servidor:**
   ```bash
   cd server
   npm install  # se não foi feito
   node index.js
   ```

3. **Abra http://localhost:3000 em 2 abas diferentes**

4. **Na Aba 1:**
   - Clique "PvP MULTIPLAYER"
   - Clique "CRIAR SALA"
   - Copie o código que aparece (ex: 3847)

5. **Na Aba 2:**
   - Clique "PvP MULTIPLAYER"
   - Clique "ENTRAR SALA"
   - Digite o código copiado e pressione Enter

6. **Abra o DevTools (F12) em AMBAS as abas** e vá para aba "Console"

7. **Procure pelos logs:**
   ```
   [MatchmakingScene] room:joined received
   [MatchmakingScene] setMultiplayer(true), starting GameScene
   [GameScene] isMultiplayer: true
   ```

8. **Se não vir esses logs ou se vir `isMultiplayer: false`, o problema está aí!**

## Logs esperados no Console do Servidor (Terminal):
```
[CONNECT] Socket ...
[ROOM] Created XXXX by ...
[ROOM] XXXX full: ... vs ...
[MOVE] Player ... position received (deve aparecer continuamente)
```

## Se vir `[MOVE] Player ... not in a room`, é um problema de sincronização no servidor

Compartilhe os logs do console que você vê e poderei identificar o problema exato.
