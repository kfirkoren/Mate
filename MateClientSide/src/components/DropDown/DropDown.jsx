import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { VerticalScale } from '../../utils'

const DropDown = ({ header, content }) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)

  const handleDropdownPress = () => {
    setIsDropdownVisible(!isDropdownVisible)
  }

  const renderContent = () => {
    if (Array.isArray(content)) {
      // Render list
      return (
        <ScrollView style={styles.dropdownContent} nestedScrollEnabled={true}>
          {content.map((item, index) => (
            <View key={index} style={styles.dropdownItem}>
              <Text style={styles.dropdownItemText}>{item.label || item}</Text>
            </View>
          ))}
        </ScrollView>
      )
    } else if (typeof content === 'string' || typeof content === 'number') {
      // Render single value
      return (
        <View style={styles.singleValueContainer}>
          <Text style={styles.singleValueText}>{content}</Text>
        </View>
      )
    } else if (React.isValidElement(content)) {
      // Render React component
      return content
    } else if (typeof content === 'object' && content !== null) {
      // Handle object with component and props
      const [Component, props] = Object.entries(content)[0]

      if (typeof Component === 'function') {
        return <Component {...props} />
      } else {
        console.warn(`Invalid component provided`)
        return (
          <View style={styles.singleValueContainer}>
            <Text style={styles.singleValueText}>
              Invalid component provided
            </Text>
          </View>
        )
      }
    }

    // Fallback for unexpected content type
    return (
      <View style={styles.singleValueContainer}>
        <Text style={styles.singleValueText}>Invalid content type</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.dropdown} onPress={handleDropdownPress}>
        <Text style={styles.selectedTextStyle}>{header}</Text>
        <FontAwesome
          name={isDropdownVisible ? 'angle-up' : 'angle-down'}
          size={20}
          color='#000'
        />
      </TouchableOpacity>
      {isDropdownVisible && renderContent()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {

    marginBottom: VerticalScale(10),
    width: '90%',
  },
  dropdown: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: Platform.OS === 'ios' ? 'row-reverse' : 'row',
  },
  selectedTextStyle: {
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dropdownContent: {
    // borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 150,
    marginBottom: VerticalScale(20),
  },
  dropdownItem: {
    padding: 10,
    flexDirection: Platform.OS === 'ios' ? 'row-reverse' : 'row',
    justifyContent: 'flex-start',
  },
  dropdownItemText: {
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  singleValueContainer: {
    textAlign:Platform.OS === 'ios' ? 'right' : 'left',
    padding: 10,
    // borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 8,
  },
  singleValueText: {
    fontSize: 16,
    textAlign:Platform.OS === 'ios' ? 'right' : 'left',
    writingDirection: 'rtl',
  },
})

export default DropDown
