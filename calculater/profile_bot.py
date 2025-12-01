import discord
from discord.ext import commands
import requests
import json
from datetime import datetime

# ==========================================================
# 🚨 1. الإعدادات الهامة (يجب تغييرها) 🚨
# ==========================================================

# 1.1. رمز البوت السري (Bot Token) من Discord Developer Portal
# تأكد من أنه Bot Token وليس رابط Webhook.
BOT_TOKEN = 'MTQ0NDQ3MDE1MTk0Nzg3ODcxNQ.GKrPT4.aiPa9bfkrOQykvn1pGOIwrxj430IXkuANRzjFA' 

# 1.2. رابط الـ Webhook الذي تريد أن يرسل إليه البوت بيانات البروفايل
PROFILE_WEBHOOK_URL = 'https://discord.com/api/webhooks/1442970383421669498/sGD9SkQdccksMR63l6-8sTRAu-SREk50Eyrr4nTfxJt2dctzPeQ0wvE0c6EJewr7WPHm' 

# ==========================================================
# 2. منطق البوت
# ==========================================================

intents = discord.Intents.default()
intents.message_content = True 
bot = commands.Bot(command_prefix='!', intents=intents) 

@bot.event
async def on_ready():
    print(f'✅ البوت {bot.user.name} جاهز للعمل!')
    print('يمكنك الآن كتابة "profile" في أي قناة ليبدأ العمل.')

# ⚠️ دالة جلب البيانات (يجب تحديثها يدوياً)
def get_profile_data():
    # يجب عليك تعديل هذه القيم لتناسب آخر رصيد في موقع الحصالة
    return {
        "currentBalanceILS": 610.00,  # مثال: الرصيد الحالي
        "targetILS": 2100.00,
        "wishlistCount": 1, 
        "computerCost": 4100.00 # مثال: تكلفة أغلى أمنية
    }

# دالة إرسال الـ Webhook
def send_profile_webhook():
    data = get_profile_data()
    
    current_balance = data['currentBalanceILS']
    target = data['targetILS']
    percentage = (current_balance / target) * 100
    
    embed_fields = [
        {"name": "💰 الرصيد الكلي", "value": f"**{current_balance:.2f} ILS**", "inline": True},
        {"name": "🎯 الهدف المالي", "value": f"{target:.2f} ILS", "inline": True},
        {"name": "📈 نسبة التقدم", "value": f"{percentage:.1f}%", "inline": False},
        {"name": "🎁 أغلى أمنية", "value": f"كمبيوتر بتكلفة {data['computerCost']:.2f} ILS", "inline": False}
    ]

    embed = {
        "title": "📊 ملخص حساب الحصالة الاحترافية (Profile)",
        "description": "تم طلب الملف الشخصي من Discord.",
        "color": 3447003,
        "fields": embed_fields,
        "timestamp": datetime.utcnow().isoformat()
    }

    payload = {
        "username": "خادم الحصالة الذكية",
        "avatar_url": "https://i.imgur.com/gK9fI5w.png",
        "embeds": [embed]
    }

    try:
        response = requests.post(PROFILE_WEBHOOK_URL, json=payload)
        response.raise_for_status() 
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ فشل إرسال Webhook البروفايل: {e}")
        return False

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return

    # التحقق من كلمة "profile"
    if message.content.lower().strip() == 'profile': 
        
        success = send_profile_webhook()
        
        if success:
            await message.channel.send(f"✅ تم إرسال ملفك الشخصي إلى قناة الإشعارات.")
        else:
             await message.channel.send("❌ فشل في إرسال ملفك الشخصي.")
        
    await bot.process_commands(message) 

if __name__ == "__main__":
    try:
        bot.run(BOT_TOKEN)
    except Exception as e:
        print(f"حدث خطأ أثناء تشغيل البوت: {e}")