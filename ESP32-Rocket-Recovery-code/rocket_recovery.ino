#include "WiFi.h"
#include "PubSubClient.h"
#include <Wire.h>
#include <SFE_BMP180.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <BasicLinearAlgebra.h>

SFE_BMP180 bmp180;
Adafruit_MPU6050 mpu;

const char ssid[] = "TECNO SPARK 9 Pro";
const char pass[] = "abcdefghij";
const int ledPin= 25;
//Define Mqtt Broker
#define mqtt_server "192.168.43.213"
WiFiClient espClient;
PubSubClient client(espClient);

// Simple Kalman filter variables for BMP180 altitude estimation
float estimatedAltitude = 0.0;
float errorCovariance_bmp = 1.0;
float processVariance_bmp = 0.001;
float measurementVariance_bmp = 0.1;
float kalmanGain_bmp;

// Kalman filter matrices for 2D filter (altitude & vertical velocity)
float AltitudeKalman, VelocityVerticalKalman;
BLA::Matrix<2,2> F, P, Q, I;
BLA::Matrix<2,1> G, S, K;
BLA::Matrix<1,2> H;
BLA::Matrix<1,1> R, L, inv_L, Acc, M;

// MPU and orientation variables
float Po;
float AccZInertial;
float AccZInertial_g;
float AccX_offset = 0.0;
float AngleRoll, AnglePitch;

// Shared variables for inter-task communication
float bmpAltitude;

// Task handles
TaskHandle_t TaskBMP180, TaskKalman2D, TaskStateMachine, TaskMQTTPublish;

void setup() {
  pinMode(ledPin,OUTPUT);
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  reconnectMQTT();
  
  // Initialize BMP180
  if (bmp180.begin()) {
    Serial.println("BMP180 initialized.");
    Po = calculateBasePressure(10);
  } else {
    Serial.println("BMP180 init failed.");
    while (1);
   }

  // Initialize MPU6050
  if (!mpu.begin()) {
    Serial.println("MPU6050 initialization failed!");
    while (1);
  } else {
    Serial.println("MPU6050 initialization successful");
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  // Initialize Kalman filter matrices
  F = {1, 0.002, 0, 1};
  G = {0.5 * 0.002 * 0.002, 0.002};
  H = {1, 0};
  I = {1, 0, 0, 1};
  Q = G * ~G * 4.0f * 4.0f;
  R = {0.3 * 0.3};
  P = {0, 0, 0, 0};
  S = {0, 0};

  calibrateSensor();

  // Create tasks
  xTaskCreatePinnedToCore(taskBMP180, "BMP180 Task", 4096, NULL, 1, &TaskBMP180, 1);
  xTaskCreatePinnedToCore(taskKalman2D, "Kalman 2D Task", 4096, NULL, 1, &TaskKalman2D, 1);
  xTaskCreatePinnedToCore(taskStateMachine, "State Machine Task", 4096, NULL, 1, &TaskStateMachine, 1);
  xTaskCreatePinnedToCore(taskMQTTPublish, "MQTT Publish Task", 4096, NULL, 1, &TaskMQTTPublish, 1);

}

// BMP180 altitude reading task
void taskBMP180(void *pvParameters) {
  while (true) {
    double T, P;
    char status = bmp180.startTemperature();
    if (status != 0) {
      delay(10);
      status = bmp180.getTemperature(T);
      if (status != 0) {
        status = bmp180.startPressure(3);
        if (status != 0) {
          delay(status);
          status = bmp180.getPressure(P, T);
          if (status != 0) {
            bmpAltitude = bmp180.altitude(P, Po);
            estimatedAltitude = kalmanFilter(bmpAltitude);
          }
        }
      }
    }
    vTaskDelay(50/ portTICK_PERIOD_MS);
  }
}

// Apply Kalman filter to new altitude measurements
float kalmanFilter(float z) {
  float estimatedAltitude_pred = estimatedAltitude;
  float errorCovariance_pred = errorCovariance_bmp + processVariance_bmp;
  kalmanGain_bmp = errorCovariance_pred / (errorCovariance_pred + measurementVariance_bmp);
  estimatedAltitude = estimatedAltitude_pred + kalmanGain_bmp * (z - estimatedAltitude_pred);
  errorCovariance_bmp = (1 - kalmanGain_bmp) * errorCovariance_pred;

  return estimatedAltitude;
}

// 2D Kalman filter task
void taskKalman2D(void *pvParameters) {
  sensors_event_t a, g, temp;
  while (true) {
    mpu.getEvent(&a, &g, &temp);

    // Calculate tilt-adjusted AccZInertial
    AngleRoll = atan2(a.acceleration.y, sqrt(a.acceleration.x * a.acceleration.x + (a.acceleration.z+1.0) * a.acceleration.z)) * 180 / PI;
    AnglePitch = atan2(-a.acceleration.x, sqrt(a.acceleration.y * a.acceleration.y + (a.acceleration.z+1.0)* a.acceleration.z)) * 180 / PI;
    //Gravitational acceleration is in the downward direction and is taken as positive ,since we are moving upwards, we need to invert the sign so that g is negative
    AccZInertial = -((-sin(AnglePitch * (PI / 180)) * a.acceleration.x +
            cos(AnglePitch * (PI / 180)) * sin(AngleRoll * (PI / 180)) * a.acceleration.y +
            cos(AnglePitch * (PI / 180)) * cos(AngleRoll * (PI / 180)) * a.acceleration.z) - 8.93);//should be -9.81 , taken as 9 to account for error

    AccZInertial_g = AccZInertial / 9.81;

    // Apply 2D Kalman filter
    Acc = {AccZInertial};
    S = F * S + G * Acc;
    P = F * P * ~F + Q;
    L = H * P * ~H + R;
    inv_L = Inverse(L);
    K = P * ~H * inv_L;
    M = {estimatedAltitude};
    S = S + K * (M - H * S);
    AltitudeKalman = S(0, 0);
    VelocityVerticalKalman = S(1, 0);
    P = (I - K * H) * P;

    // Serial output
    digitalWrite(ledPin,HIGH);
    Serial.print("Altitude:"); Serial.print(AltitudeKalman); Serial.print(",");
    Serial.print("VerticalVelocity:"); Serial.print(VelocityVerticalKalman); Serial.print(",");
    Serial.print("AccZInertial (m/s²):"); Serial.print(AccZInertial); Serial.print(",");
    Serial.print("AccZInertial (g):"); Serial.print(AccZInertial_g); Serial.print(",");
    Serial.print("GyroX:"); Serial.print(g.gyro.x); Serial.print(",");
    Serial.print("GyroY:"); Serial.print(g.gyro.y); Serial.print(",");
    Serial.print("GyroZ:"); Serial.print(g.gyro.z); Serial.print(",");
    Serial.print("Temp:"); Serial.println(temp.temperature);

    vTaskDelay(50 / portTICK_PERIOD_MS);
  }
}

// State machine task
void taskStateMachine(void *pvParameters) {
  enum State {
    PREFLIGHT,
    POWERED_FLIGHT,
    COASTING,
    APOGEE,
    DROGUE_DESCENT,
    MAIN_DESCENT,
    POSTFLIGHT
  };

  State currentState = PREFLIGHT;

  while (true) {
    int conditionsMet = 0;  // Declare conditionsMet outside the switch block

    switch (currentState) {
      case PREFLIGHT: {
        if (AccZInertial > 0 && AltitudeKalman > 0.5) {
          currentState = POWERED_FLIGHT;
        }
        break;
      }

      case POWERED_FLIGHT: {
        if (VelocityVerticalKalman <= 0) {
          currentState = COASTING;
        }
        break;
      }

      case COASTING: {
        // Apogee detection: check if two out of the three conditions are met
        conditionsMet = 0;
        if (abs(VelocityVerticalKalman) < 1) conditionsMet++;  // Condition 1: near-zero vertical velocity
        if (abs(AccZInertial) < 0.1) conditionsMet++;          // Condition 2: near-zero vertical acceleration
        if (AnglePitch > 70) conditionsMet++;                  // Condition 3: angle pitch > 70 degrees

        if (conditionsMet >= 2) {
          currentState = APOGEE;
        }
        break;
      }

      case APOGEE: {
        currentState = DROGUE_DESCENT;
        break;
      }

      case DROGUE_DESCENT: {
        if (AltitudeKalman <= AltitudeKalman / 3) {
          currentState = MAIN_DESCENT;
        }
        break;
      }

      case MAIN_DESCENT: {
        if (VelocityVerticalKalman < 0.3) {
          currentState = POSTFLIGHT;
        }
        break;
      }

      case POSTFLIGHT:
        // Landing state reached
        break;
    }
    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
}

// MQTT publishing task
void taskMQTTPublish(void *pvParameters) {
  while (true) {
    // Ensure MQTT client stays connected
    if (!client.connected()) {
      reconnectMQTT(); // Custom function to handle MQTT reconnection
    }
    client.loop();

    // Prepare sensor data as JSON string
    char payload[128];
    snprintf(payload, sizeof(payload), 
             "{\"altitude\":%.2f,\"vertical_velocity\":%.2f,\"acceleration\":%.2f}", 
             AltitudeKalman, VelocityVerticalKalman, AccZInertial);

    // Publish data to the specified MQTT topic
    client.publish("esp32/sensor_data", payload);

    // Delay to control publishing rate (e.g., 1 Hz)
    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
}

// Reconnect to MQTT broker if disconnected
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32Client")) {
      Serial.println("connected");
      client.subscribe("esp32/commands"); // Subscribe to any relevant topic
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" trying again in 2 seconds");
      delay(2000);
    }
  }
}




// Calibrate the sensor by taking multiple readings
void calibrateSensor() {
  const int numReadings = 100;
  sensors_event_t a, g, temp;
  float x_sum = 0;

  for (int i = 0; i < numReadings; i++) {
    mpu.getEvent(&a, &g, &temp);
    x_sum += a.acceleration.x;
    delay(10);
  }

  AccX_offset = x_sum / numReadings;
}

// Calculate the base pressure by averaging readings
float calculateBasePressure(int numReadings) {
  double T, P, totalPressure = 0;
  char status;

  for (int i = 0; i < numReadings; i++) {
    status = bmp180.startTemperature();
    if (status != 0) {
      delay(200);
      status = bmp180.getTemperature(T);
      if (status != 0) {
        status = bmp180.startPressure(3);
        if (status != 0) {
          delay(status);
          status = bmp180.getPressure(P, T);
          if (status != 0) {
            totalPressure += P;
          }
        }
      }
    }
    //delay(100);
  }

  return totalPressure / numReadings;
}

void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, pass);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}



void loop() {
  // The loop is empty as tasks run independently
}