# תכונות מתקדמות במערכת AudioChat

מסמך זה מתאר את התכונות המתקדמות שנוספו למערכת AudioChat, כולל הסברים מפורטים על אופן השימוש בהן.

## תוכן עניינים

1. [שיפורי בקאנד](#שיפורי-בקאנד)
   - [מערכת קאשינג](#מערכת-קאשינג)
   - [עיבוד מקבילי](#עיבוד-מקבילי)
   - [אלגוריתמים מתקדמים לעיבוד אודיו](#אלגוריתמים-מתקדמים-לעיבוד-אודיו)
2. [שיפורי פרונטאנד](#שיפורי-פרונטאנד)
   - [תצוגת מידע מתקדם](#תצוגת-מידע-מתקדם)
   - [אנימציות גלי קול](#אנימציות-גלי-קול)
3. [שיפורי AI](#שיפורי-ai)
   - [שילוב מודל שפה גדול (LLM)](#שילוב-מודל-שפה-גדול-llm)
   - [זיהוי בעיות אוטומטי](#זיהוי-בעיות-אוטומטי)
   - [ניתוח אודיו מתקדם](#ניתוח-אודיו-מתקדם)
4. [אינטגרציה ושימוש](#אינטגרציה-ושימוש)
   - [התקנה והגדרה](#התקנה-והגדרה)
   - [דוגמאות שימוש](#דוגמאות-שימוש)
   - [פתרון בעיות נפוצות](#פתרון-בעיות-נפוצות)

## שיפורי בקאנד

### מערכת קאשינג

מערכת הקאשינג מאפשרת לשמור תוצאות עיבוד אודיו, ניתוח אודיו ונתוני גלי קול כדי לשפר את הביצועים ולחסוך זמן עיבוד בבקשות חוזרות.

#### איך זה עובד

1. **שמירת תוצאות עיבוד**: כאשר קובץ אודיו מעובד, התוצאה נשמרת במטמון עם מפתח המבוסס על תוכן הקובץ וההוראות לעיבוד.
2. **שמירת ניתוח אודיו**: תוצאות ניתוח האודיו נשמרות במטמון כדי למנוע ניתוח חוזר של אותו קובץ.
3. **שמירת נתוני גלי קול**: נתוני הויזואליזציה של גלי הקול נשמרים במטמון לשימוש חוזר.
4. **ניקוי אוטומטי**: המערכת מנקה אוטומטית קבצים ישנים מהמטמון כדי לשמור על שימוש יעיל בשטח האחסון.

#### הגדרות

ניתן להגדיר את מערכת הקאשינג באמצעות הפרמטרים הבאים:

- `cache_dir`: תיקיית המטמון (ברירת מחדל: `cache`)
- `max_age_days`: גיל מקסימלי של קבצים במטמון בימים (ברירת מחדל: 7)

#### דוגמת שימוש

```python
from cache_manager import cache_manager

# בדיקה אם קובץ נמצא במטמון
cached_audio = cache_manager.get_processed_audio(file_id, instructions)
if cached_audio:
    audio_data, sample_rate = cached_audio
    # השתמש בקובץ מהמטמון
else:
    # עבד את הקובץ ושמור במטמון
    audio_data, sample_rate = process_audio(...)
    cache_manager.cache_processed_audio(file_id, instructions, audio_data, sample_rate)
```

### עיבוד מקבילי

מערכת העיבוד המקבילי מאפשרת לעבד קבצי אודיו גדולים במקביל, מה שמשפר משמעותית את הביצועים בקבצים ארוכים.

#### איך זה עובד

1. **חלוקה לחלקים**: הקובץ מחולק לחלקים קטנים יותר עם חפיפה ביניהם.
2. **עיבוד מקבילי**: כל חלק מעובד במקביל בתהליך נפרד.
3. **מיזוג חלקים**: החלקים המעובדים ממוזגים בחזרה לקובץ אחד עם crossfade באזורי החפיפה.

#### הגדרות

ניתן להגדיר את מערכת העיבוד המקבילי באמצעות הפרמטרים הבאים:

- `max_workers`: מספר מקסימלי של תהליכים מקבילים (ברירת מחדל: מספר המעבדים במערכת)
- `chunk_duration_seconds`: אורך כל חלק בשניות (ברירת מחדל: 10)
- `overlap_seconds`: חפיפה בין חלקים בשניות (ברירת מחדל: 0.5)

#### דוגמת שימוש

```python
from parallel_processor import parallel_processor

# עיבוד קובץ גדול במקביל
processed_audio = parallel_processor.process_audio_with_effects_parallel(
    audio_data,
    sample_rate,
    effects_chain,
    chunk_duration_seconds=10.0,
    overlap_seconds=0.5
)
```

### אלגוריתמים מתקדמים לעיבוד אודיו

המערכת כוללת אלגוריתמים מתקדמים לעיבוד אודיו, כולל הפרדת קול מכלי נגינה, הסרת רעשים מתקדמת, הרמוניזציה ועוד.

#### תכונות עיקריות

1. **הפרדת מקורות**: הפרדת קול מכלי נגינה באמצעות Spleeter.
2. **שיפור קול**: שיפור איכות הקול באמצעות אלגוריתמים מתקדמים.
3. **בידוד כלי נגינה**: בידוד כלי נגינה ספציפיים מתוך מיקס.
4. **הסרת רעשים**: הסרת רעשי רקע באמצעות אלגוריתמים מתקדמים.
5. **הרמוניזציה**: הוספת הרמוניות לקול.

#### דוגמת שימוש

```python
from advanced_audio_effects import advanced_effects

# הפרדת קול מכלי נגינה
sources = advanced_effects.separate_sources(audio_data, sample_rate, mode="2stems")
vocals = sources["vocals"]
accompaniment = sources["accompaniment"]

# שיפור קול
enhanced_vocals = advanced_effects.enhance_vocals(vocals, sample_rate, strength=0.7)

# הסרת רעשים
denoised_audio = advanced_effects.denoise_audio(audio_data, sample_rate, strength=0.5)

# הרמוניזציה
harmonized_audio = advanced_effects.harmonize_audio(vocals, sample_rate, semitones=[4, 7])
```

## שיפורי פרונטאנד

### תצוגת מידע מתקדם

רכיב `AudioAnalysisDisplay` מציג מידע מפורט על האודיו, כולל מאפיינים ספקטרליים, דינמיקה, מאפיינים מוזיקליים ועוד.

#### תכונות עיקריות

1. **לשוניות מידע**: המידע מחולק ללשוניות נושאיות לנוחות המשתמש.
2. **מידע ספקטרלי**: מציג מידע על תוכן התדרים של האודיו.
3. **מידע דינמי**: מציג מידע על הדינמיקה של האודיו.
4. **מידע מוזיקלי**: מציג מידע על מאפיינים מוזיקליים כמו מפתח וטמפו.

#### דוגמת שימוש

```jsx
import AudioAnalysisDisplay from './components/AudioAnalysisDisplay';

// בקומפוננטה
<AudioAnalysisDisplay audioAnalysis={processedAudio.audio_analysis} />
```

### אנימציות גלי קול

רכיב `AnimatedWaveform` מציג גלי קול אנימטיביים בזמן אמת, מה שמשפר את חווית המשתמש ומספק משוב ויזואלי על האודיו.

#### תכונות עיקריות

1. **אנימציה בזמן אמת**: הצגת גלי הקול בזמן אמת בהתאם לאודיו המושמע.
2. **התאמה אישית**: אפשרות להתאים את הצבע והגודל של הגלים.
3. **תמיכה בהשהיה והפעלה**: הגלים מתעדכנים בהתאם למצב ההשמעה.

#### דוגמת שימוש

```jsx
import AnimatedWaveform from './components/AnimatedWaveform';

// בקומפוננטה
<AnimatedWaveform 
  audioUrl={audioUrl}
  isPlaying={isPlaying}
  color="#10a37f"
/>
```

## שיפורי AI

### שילוב מודל שפה גדול (LLM)

המערכת משלבת מודלים של שפה גדולים (LLM) כמו GPT-4, Claude או Gemini לניתוח מדויק יותר של הוראות המשתמש והמרתן לפרמטרים טכניים.

#### איך זה עובד

1. **ניתוח הוראות**: המערכת מנתחת את הוראות המשתמש בשפה טבעית.
2. **המרה לפרמטרים**: ההוראות מומרות לפרמטרים טכניים של אפקטים.
3. **יצירת שרשרת אפקטים**: המערכת יוצרת שרשרת אפקטים אופטימלית בהתאם להוראות.
4. **מנגנון גיבוי**: אם ה-LLM לא זמין, המערכת משתמשת במנגנון עיבוד מבוסס חוקים.

#### הגדרות

ניתן להגדיר את מעבד ה-LLM באמצעות משתני סביבה:

- `OPENAI_API_KEY`: מפתח API של OpenAI
- `ANTHROPIC_API_KEY`: מפתח API של Anthropic
- `GOOGLE_API_KEY`: מפתח API של Google

#### דוגמת שימוש

```python
from llm_processor import llm_processor

# עיבוד הוראות באמצעות LLM
effects_chain = llm_processor.process_instructions(
    "הוסף קצת רוורב ועשה את הקול יותר ברור",
    audio_analysis
)
```

### זיהוי בעיות אוטומטי

המערכת מזהה אוטומטית בעיות באודיו ומציעה תיקונים, מה שמשפר את איכות התוצאה הסופית.

#### בעיות שהמערכת מזהה

1. **Clipping**: זיהוי עיוותים בגלל עוצמה גבוהה מדי.
2. **רעשי רקע**: זיהוי רעשי רקע והצעת פתרונות להסרתם.
3. **עוצמה נמוכה**: זיהוי עוצמה נמוכה מדי והצעת פתרונות להגברה.
4. **איזון תדרים**: זיהוי חוסר איזון בתדרים והצעת תיקונים.

#### דוגמת שימוש

המערכת משתמשת בזיהוי הבעיות באופן אוטומטי כחלק מתהליך העיבוד:

```python
# ניתוח האודיו
audio_analysis = audio_processor.analyze_audio(audio_data, sample_rate)

# אם לא צוינו אפקטים ספציפיים, המערכת תציע תיקונים אוטומטיים
if not effects_chain and audio_analysis:
    if audio_analysis.get("is_too_quiet", False):
        effects_chain.append({
            "type": "gain",
            "parameters": {"gain_db": 6}
        })
        
    if audio_analysis.get("noise_floor", 0) > 0.01:
        effects_chain.append({
            "type": "noise_reduction",
            "parameters": {"strength": 0.4, "sensitivity": 0.5}
        })
```

### ניתוח אודיו מתקדם

המערכת כוללת ניתוח אודיו מתקדם שמזהה מאפיינים מוזיקליים, תכונות ספקטרליות ודינמיות של האודיו.

#### מאפיינים שהמערכת מזהה

1. **מאפיינים מוזיקליים**: מפתח, טמפו, הרמוניות.
2. **מאפיינים ספקטרליים**: תוכן תדרים, בהירות, רוחב סטריאו.
3. **מאפיינים דינמיים**: טווח דינמי, עוצמה, קומפרסיה.

#### דוגמת שימוש

```python
from audio_processing import audio_processor

# ניתוח האודיו
audio_analysis = audio_processor.analyze_audio(audio_data, sample_rate)

# שימוש בתוצאות הניתוח
print(f"Estimated key: {audio_analysis['estimated_key']}")
print(f"Estimated tempo: {audio_analysis['estimated_tempo']} BPM")
print(f"Spectral centroid: {audio_analysis['spectral_centroid']} Hz")
print(f"Crest factor: {audio_analysis['crest_factor']}")
```

## אינטגרציה ושימוש

### התקנה והגדרה

#### דרישות מערכת

- Python 3.8 ומעלה
- Node.js 14 ומעלה
- ספריות Python: librosa, soundfile, numpy, scipy, pedalboard, spleeter (אופציונלי)
- ספריות JavaScript: React, Web Audio API

#### התקנה

1. **התקנת הבקאנד**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **התקנת הפרונטאנד**:
   ```bash
   npm install
   ```

3. **הגדרת משתני סביבה**:
   צור קובץ `.env` בתיקיית `backend` עם המשתנים הבאים:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GOOGLE_API_KEY=your_google_api_key
   ```

### דוגמאות שימוש

#### עיבוד אודיו בסיסי

```python
from integration import audio_chat_system

# עיבוד קובץ אודיו
output_path, processing_steps = audio_chat_system.process_audio(
    "path/to/audio.wav",
    "הוסף קצת רוורב ועשה את הקול יותר ברור"
)

print(f"Processed audio saved to: {output_path}")
print("Processing steps:")
for step in processing_steps:
    print(f"- {step}")
```

#### הפרדת קול מכלי נגינה

```python
from integration import audio_chat_system

# הפרדת מקורות
sources = audio_chat_system.separate_sources(
    "path/to/audio.wav",
    mode="2stems"  # אפשרויות: "2stems", "4stems", "5stems"
)

print(f"Vocals saved to: {sources['vocals']}")
print(f"Accompaniment saved to: {sources['accompaniment']}")
```

#### ייצוא לפורמטים שונים

```python
from integration import audio_chat_system

# ייצוא לפורמט MP3
mp3_path = audio_chat_system.export_audio(
    "path/to/audio.wav",
    format="mp3",
    quality="high"  # אפשרויות: "low", "medium", "high"
)

print(f"Exported to MP3: {mp3_path}")
```

### פתרון בעיות נפוצות

#### בעיה: שגיאת "ModuleNotFoundError" בעת הפעלת הבקאנד

**פתרון**: ודא שהתקנת את כל הספריות הנדרשות:
```bash
pip install -r requirements.txt
```

#### בעיה: שגיאת "ImportError: cannot import name 'advanced_effects'" 

**פתרון**: ודא שהתקנת את ספריית Pedalboard:
```bash
pip install pedalboard
```

#### בעיה: שגיאת "ImportError: cannot import name 'Separator'" 

**פתרון**: ודא שהתקנת את ספריית Spleeter:
```bash
pip install spleeter
```

#### בעיה: ביצועים איטיים בעיבוד קבצים גדולים

**פתרון**: ודא שמערכת העיבוד המקבילי מופעלת ושהגדרת מספר מתאים של workers:
```python
from parallel_processor import parallel_processor
parallel_processor.max_workers = 4  # התאם למספר המעבדים במערכת שלך
```

#### בעיה: שגיאת "API key not found" בעת שימוש ב-LLM

**פתרון**: ודא שהגדרת את מפתחות ה-API הנדרשים בקובץ `.env`:
```
OPENAI_API_KEY=your_openai_api_key
```