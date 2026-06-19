#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>

// ================= WIFI =================
const char* ssid = "Gurvir";
const char* password = "Yhg123gh";

// ================= SUPABASE =================
const String supabaseUrl = "https://nqlsjjplxjzeocppqrcg.supabase.co";
const String supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xbHNqanBseGp6ZW9jcHBxcmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTAzMjYsImV4cCI6MjA5NjkyNjMyNn0.pfrIau9H5l8TV5Ny0lt5ewgT3RJDxVp7AwYQceSqkpI";
const String tableName = "commands";

// ================= L298N MOTOR PINS =================
#define IN1 26
#define IN2 27
#define IN3 14
#define IN4 12
#define ENA 25
#define ENB 33

// ================= L293D MOTOR PINS =================
#define MOTOR2_IN1 18
#define MOTOR2_IN2 19

// ================= SERVO =================
#define SERVO_PIN 13
Servo myServo;
unsigned long lastServoMove = 0;
int servoTarget = 120;

// ================= MOTOR SETUP =================
void motorSetup() {
  // L298N
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  ledcAttach(ENA, 1000, 8);
  ledcAttach(ENB, 1000, 8);

  // L293D - always on
  pinMode(MOTOR2_IN1, OUTPUT);
  pinMode(MOTOR2_IN2, OUTPUT);
  digitalWrite(MOTOR2_IN1, HIGH);
  digitalWrite(MOTOR2_IN2, LOW);

  // Servo
  myServo.attach(SERVO_PIN);
  myServo.write(0);

  Serial.println("Motors ready");
}

// ================= MOTOR CONTROL =================
void stopMotors() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  ledcWrite(ENA, 0);
  ledcWrite(ENB, 0);
  // L293D and servo keep running
}

void forward(int t) {
  Serial.println(">>> FORWARD for " + String(t) + "s");
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  ledcWrite(ENA, 170);
  ledcWrite(ENB, 170);
  delay(t * 1000);
  stopMotors();
  Serial.println(">>> STOPPED");
}

void turnRight(int t) {
  Serial.println(">>> TURN RIGHT for " + String(t) + "s");
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  ledcWrite(ENA, 170);
  ledcWrite(ENB, 170);
  delay(t * 1000);
  stopMotors();
  Serial.println(">>> STOPPED");
}

// ================= SERVO SWEEP =================
void updateServo() {
  if (millis() - lastServoMove > 300) {
    myServo.write(servoTarget);
    servoTarget = (servoTarget == 120) ? 0 : 120;
    lastServoMove = millis();
  }
}

// ================= WIFI =================
void connectWiFi() {
  WiFi.disconnect(true);
  delay(500);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi FAILED - restarting...");
    delay(2000);
    ESP.restart();
  }
}

// ================= SUPABASE GET =================
String getCommand() {
  HTTPClient http;

  String url = supabaseUrl + "/rest/v1/" + tableName +
               "?select=*&processed=eq.false&order=id.asc&limit=1";

  Serial.println("GET: " + url);

  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + supabaseKey);
  http.setTimeout(5000);

  int code = http.GET();
  Serial.println("GET code: " + String(code));

  if (code != 200) {
    http.end();
    return "";
  }

  String res = http.getString();
  Serial.println("Response: " + res);
  http.end();
  return res;
}

// ================= MARK PROCESSED =================
void markProcessed(int id) {
  HTTPClient http;

  String url = supabaseUrl + "/rest/v1/" + tableName + "?id=eq." + String(id);
  Serial.println("PATCH: " + url);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + supabaseKey);
  http.addHeader("Prefer", "return=minimal");
  http.setTimeout(5000);

  int code = http.PATCH("{\"processed\":true}");
  Serial.println("PATCH code: " + String(code));

  http.end();
}

// ================= PARSE + EXECUTE =================
void handleCommand(String data) {
  if (data == "[]" || data.length() < 5) {
    Serial.println("No commands.");
    return;
  }

  // extract id
  int id = -1;
  int idPos = data.indexOf("\"id\":");
  if (idPos != -1) {
    int start = idPos + 5;
    int end = data.indexOf(",", start);
    if (end == -1) end = data.indexOf("}", start);
    id = data.substring(start, end).toInt();
  }
  Serial.println("ID: " + String(id));

  // extract command
  int cStart = data.indexOf("\"command\":\"");
  if (cStart == -1) {
    Serial.println("No command field found.");
    return;
  }
  cStart += 11;
  int cEnd = data.indexOf("\"", cStart);
  String command = data.substring(cStart, cEnd);
  Serial.println("Command: " + command);

  // parse action and value
  String action = command;
  int value = 1;
  int underscore = command.indexOf("_");
  if (underscore != -1) {
    action = command.substring(0, underscore);
    value = command.substring(underscore + 1).toInt();
  }
  Serial.println("Action: " + action + " | Value: " + String(value));

  // execute
  if (action == "move") forward(value);
  else if (action == "turn") turnRight(value);
  else Serial.println("Unknown action: " + action);

  // mark done
  if (id > 0) markProcessed(id);
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\nBOOTING...");

  connectWiFi();
  motorSetup();

  Serial.println("ROBOT READY");
}

// ================= LOOP =================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost, reconnecting...");
    connectWiFi();
  }

  updateServo();

  String data = getCommand();
  handleCommand(data);

  delay(1200);
}
