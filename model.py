import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.preprocessing.image import ImageDataGenerator, save_img
from tensorflow.keras.utils import img_to_array, load_img
from sklearn.metrics import classification_report, roc_auc_score, roc_curve
import matplotlib.pyplot as plt

# Paths
input_path = r'E:\ai project\dataset'
output_path = r'E:\ai project\output'
img_size = 128
batch_size = 32

# Create the output directory structure if it doesn't exist
os.makedirs(output_path, exist_ok=True)
for class_folder in os.listdir(input_path):
    os.makedirs(os.path.join(output_path, class_folder), exist_ok=True)

# Initialize the ImageDataGenerator for resizing and augmentation
datagen = ImageDataGenerator(
    rescale=1.0 / 255.0,  # Normalization
    horizontal_flip=True,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    zoom_range=0.2
)

# Resize and save images
for class_folder in os.listdir(input_path):
    class_input_path = os.path.join(input_path, class_folder)
    class_output_path = os.path.join(output_path, class_folder)
    
    for img_name in os.listdir(class_input_path):
        img_path = os.path.join(class_input_path, img_name)
        img = load_img(img_path, target_size=(img_size, img_size))  # Resize
        img_array = img_to_array(img)  # Convert to array
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        
        # Generate augmented images
        for i, batch in enumerate(datagen.flow(img_array, batch_size=1)):
            save_path = os.path.join(class_output_path, f"{os.path.splitext(img_name)[0]}aug{i}.jpg")
            save_img(save_path, batch[0])
            if i >= 4:  # Save up to 5 augmented versions per image
                break

print(f"Resized and augmented images saved to {output_path}")

# Dataset preparation
datagen_train = ImageDataGenerator(
    rescale=1.0 / 255.0,
    validation_split=0.2
)

train_data = datagen_train.flow_from_directory(
    output_path,
    target_size=(img_size, img_size),
    batch_size=batch_size,
    class_mode='binary',
    subset='training'
)

val_data = datagen_train.flow_from_directory(
    output_path,
    target_size=(img_size, img_size),
    batch_size=batch_size,
    class_mode='binary',
    subset='validation'
)

# CNN model definition
model = Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(img_size, img_size, 3)),
    MaxPooling2D((2, 2)),
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),
    Conv2D(128, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),
    Flatten(),
    Dense(128, activation='relu'),
    Dropout(0.5),
    Dense(1, activation='sigmoid')
])

# Compile the model
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
              loss='binary_crossentropy',
              metrics=['accuracy'])

# Train the model
history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=20
)

# Plot metrics
def plot_metrics(history):
    plt.figure(figsize=(12, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Train Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.legend()
    plt.title('Accuracy')

    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.legend()
    plt.title('Loss')

    plt.show()

plot_metrics(history)

# Evaluate and predict
y_true = val_data.classes
y_pred_prob = model.predict(val_data)
y_pred = np.round(y_pred_prob).astype(int)

print(classification_report(y_true, y_pred))
print("AUC-ROC:", roc_auc_score(y_true, y_pred_prob))

# Plot ROC curve
fpr, tpr, _ = roc_curve(y_true, y_pred_prob)
plt.plot(fpr, tpr, label=f'AUC = {roc_auc_score(y_true, y_pred_prob):.2f}')
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve')
plt.legend()
plt.show()

# Transfer Learning (ResNet50 example)
base_model = tf.keras.applications.ResNet50(weights='imagenet', include_top=False, input_shape=(img_size, img_size, 3))
base_model.trainable = False

transfer_model = Sequential([
    base_model,
    Flatten(),
    Dense(128, activation='relu'),
    Dropout(0.5),
    Dense(1, activation='sigmoid')
])

transfer_model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
                       loss='binary_crossentropy',
                       metrics=['accuracy'])

transfer_history = transfer_model.fit(
    train_data,
    validation_data=val_data,
    epochs=10
)

plot_metrics(transfer_history)