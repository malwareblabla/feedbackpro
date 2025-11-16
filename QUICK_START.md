# 🚀 Quick Start Guide - FeedbackPro

## Najszybszy sposób uruchomienia

### Metoda 1: Automatyczny start (Zalecana)

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```
Kliknij dwukrotnie start.bat
```

### Metoda 2: Manualne uruchomienie

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm install
npm start
```

---

## 🎯 Pierwsze kroki po uruchomieniu

1. **Otwórz przeglądarkę**: http://localhost:3000

2. **Stwórz projekt**:
   - Kliknij "+ New Project"
   - Wpisz nazwę np. "Demo Project"
   - Kliknij "Create Project"

3. **Wgraj plik**:
   - Przeciągnij video/zdjęcie na stronę
   - LUB kliknij obszar uploadu

4. **Dodaj komentarz**:
   - Kliknij na wgrany plik
   - Jeśli to video: odtwórz i kliknij "Mark Time"
   - Jeśli to zdjęcie: kliknij "Draw" i narysuj
   - Wpisz komentarz i kliknij "Post Comment"

---

## 🔧 Rozwiązywanie problemów

### Backend nie startuje
```bash
# Sprawdź czy port 5000 jest wolny
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Jeśli zajęty, zakończ proces lub zmień port w backend/server.js
```

### Frontend nie łączy się z backendem
1. Sprawdź czy backend działa: http://localhost:5000/api/projects
2. Sprawdź CORS w `backend/server.js`
3. Upewnij się że oba serwery działają

### Nie możesz wgrać plików
1. Sprawdź czy folder `backend/uploads` istnieje
2. Sprawdź uprawnienia do zapisu
3. Sprawdź limit rozmiaru (domyślnie 500MB)

### Canvas/rysowanie nie działa
1. Otwórz Console (F12)
2. Sprawdź czy są błędy Fabric.js
3. Odśwież stronę (Ctrl+R)

---

## 📋 Szybka checklist

- [ ] Node.js 16+ zainstalowany
- [ ] Backend uruchomiony (port 5000)
- [ ] Frontend uruchomiony (port 3000)
- [ ] Brak błędów w konsoli
- [ ] Możesz stworzyć projekt
- [ ] Możesz wgrać plik
- [ ] Możesz dodać komentarz

---

## 🎓 Następne kroki

1. Przeczytaj `README.md` - pełna dokumentacja
2. Zobacz `BUSINESS_PLAN.md` - strategia biznesowa
3. Zacznij customizować kod pod swoje potrzeby
4. Dodaj własne funkcje z roadmapy

---

## 💡 Przykładowe workflow

### Dla zespołu video produkcyjnego:
1. Reżyser tworzy projekt "Commercial XYZ"
2. Editor wgrywa rough cut (MP4)
3. Reżyser ogląda i dodaje komentarze z timestampami:
   - "0:15 - za szybkie cięcie"
   - "1:30 - dodaj muzykę tutaj"
4. Editor widzi feedback w real-time
5. Editor wgrywa nową wersję
6. Reżyser zatwierdza

### Dla agencji marketingowej:
1. PM tworzy projekt "Client Logo Designs"
2. Designer wgrywa 3 wersje logo (PNG)
3. Klient klika na preferowaną wersję
4. Klient rysuje na obrazie: "powiększ ten element"
5. Designer dostaje precyzyjny feedback
6. Finalizacja 3x szybciej niż przez email

---

## 📞 Potrzebujesz pomocy?

- GitHub Issues: [tu będzie link]
- Email: [twój email]
- Discord: [community link]

**Powodzenia! 🚀**
