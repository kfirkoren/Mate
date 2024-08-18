import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { VerticalScale } from '../../utils'
import Theme from '../../../assets/styles/theme'

const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const [isStartDatePickerVisible, setStartDatePickerVisibility] =
    useState(false)
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false)

  const showStartDatePicker = () => {
    setStartDatePickerVisibility(true)
  }

  const hideStartDatePicker = () => {
    setStartDatePickerVisibility(false)
  }

  const showEndDatePicker = () => {
    setEndDatePickerVisibility(true)
  }

  const hideEndDatePicker = () => {
    setEndDatePickerVisibility(false)
  }

  const handleStartConfirm = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Remove the time portion for comparison
    if (date < today) {
      Alert.alert('שגיאה', 'תאריך ההתחלה לא יכול להיות לפני היום הנוכחי.')
    } else {
      onStartDateChange(date)
      if (endDate && date > endDate) {
        onEndDateChange(null) // Clear end date if start date is after it
      }
    }
    hideStartDatePicker()
  }

  const handleEndConfirm = (date) => {
    if (date < startDate) {
      Alert.alert('שגיאה', 'תאריך הסיום לא יכול להיות לפני תאריך ההתחלה.')
    } else {
      onEndDateChange(date)
    }
    hideEndDatePicker()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Remove the time portion for the minimum date

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.touchableArea, { marginBottom: VerticalScale(24) }]}
        onPress={showStartDatePicker}
      >
        <Text style={styles.selectedDate}>
          {startDate
            ? `תאריך התחלה: ${startDate.toLocaleDateString()}`
            : 'בחר תאריך התחלה'}
        </Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode='date'
        onConfirm={handleStartConfirm}
        onCancel={hideStartDatePicker}
        minimumDate={today} // Set minimum date to today
      />

      <TouchableOpacity
        style={styles.touchableArea}
        onPress={showEndDatePicker}
      >
        <Text style={styles.selectedDate}>
          {endDate
            ? `תאריך סיום: ${endDate.toLocaleDateString()}`
            : 'בחר תאריך סיום'}
        </Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode='date'
        onConfirm={handleEndConfirm}
        onCancel={hideEndDatePicker}
        minimumDate={startDate || today} // Set minimum date to startDate or today
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: VerticalScale(24),
    width: '90%',
  },
  touchableArea: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'black',
    paddingHorizontal: 10,
    textAlign: 'left',
    direction: 'rtl',
    marginBottom: 10,
  },
  selectedDate: {
    fontFamily: Theme.primaryText.fontFamily,
    fontSize: 16,
    textAlign: 'right',
  },
})

export default DateRangePicker
