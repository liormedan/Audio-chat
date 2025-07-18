# Implementation Plan

- [x] 1. עדכון קובץ direct-access.bat


  - יצירת קובץ HTML זמני שיגדיר את הדגלים הנדרשים ב-localStorage
  - הוספת בדיקות לשרת האחורי והקדמי
  - _Requirements: 1.1, 1.2_

- [x] 2. עדכון קובץ App.js


  - [x] 2.1 שינוי ההגדרה הראשונית של activePage


    - שינוי useState כך שיבדוק את localStorage בעת האתחול
    - הוספת לוגיקה לבדיקת הדגל defaultPage
    - _Requirements: 1.1, 2.1, 2.2_
  

  - [ ] 2.2 הוספת useEffect לבדיקת פרמטרי URL
    - הוספת useEffect שיבדוק את פרמטרי ה-URL בעת טעינת הקומפוננטה
    - עדכון activePage בהתאם לפרמטר page
    - _Requirements: 1.1, 1.3_

  
  - [ ] 2.3 עדכון useEffect לניהול אירועי ניווט
    - עדכון useEffect שמטפל באירועי navigationChange
    - הוספת בדיקה של localStorage לפני בדיקת פרמטרי URL
    - מחיקת הדגל defaultPage לאחר השימוש בו
    - _Requirements: 1.2, 1.3, 2.2_


- [x] 3. יצירת קובץ direct-access-launcher.html

  - יצירת דף HTML שיגדיר את הדגלים הנדרשים ב-localStorage


  - הוספת סקריפט שיפנה לדף הראשי עם הפרמטרים הנכונים
  - _Requirements: 1.1, 3.1_

- [ ] 4. בדיקות ותיקון באגים
  - [ ] 4.1 בדיקת הפעלה רגילה
    - וידוא שהאפליקציה נפתחת בדף הבית בהפעלה רגילה
    - בדיקה שהניווט עובד כרגיל
    - _Requirements: 1.2, 1.3, 3.1_
  
  - [ ] 4.2 בדיקת הפעלה עם direct-access.bat
    - וידוא שהאפליקציה נפתחת בדף הצ'אט בהפעלה עם direct-access.bat
    - בדיקה שהתפריט הצדדי עדיין זמין
    - _Requirements: 1.1, 1.2, 3.1, 3.3_
  
  - [ ] 4.3 בדיקת זיכרון מצב
    - וידוא שהאפליקציה זוכרת את המצב האחרון בין הפעלות רגילות
    - וידוא שהאפליקציה מתעלמת מהמצב האחרון בהפעלה עם direct-access.bat
    - _Requirements: 2.1, 2.2, 3.2_