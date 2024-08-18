import React, { useState, useEffect, useContext } from 'react'
import { HorizontalScale } from '../../utils'
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  writeBatch,
  increment,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import { AuthContext } from '../../../AuthContext'
import BackArrow from '../../components/BackArrow/backArrow'
import Ionicons from 'react-native-vector-icons/Ionicons'
import Theme from '../../../assets/styles/theme'
import { VerticalScale } from '../../utils'

const DEFAULT_AVATAR = 'https://example.com/default-avatar.png'

const ChatPage = ({ route, navigation }) => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { loggedInUser } = useContext(AuthContext)
  const { conversationId, otherUserId, otherUser } = route.params

  useEffect(() => {
    setIsLoading(true)
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'desc'),
      ),
      (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
        }))
        setMessages(messagesData)
        setIsLoading(false)
        markMessagesAsSeen(messagesData)
      },
      (error) => {
        console.error('Error fetching messages:', error)
        setIsLoading(false)
      },
    )

    // Reset unread count when opening the chat
    resetUnreadCount()

    return () => unsubscribe()
  }, [conversationId])

  const resetUnreadCount = async () => {
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        [`unreadCount.${loggedInUser.uid}`]: 0,
      })
    } catch (error) {
      console.error('Error resetting unread count:', error)
    }
  }

  const markMessagesAsSeen = async (messagesData) => {
    const batch = writeBatch(db)
    const unseenMessages = messagesData.filter(
      (msg) => msg.senderId !== loggedInUser.uid && !msg.seen,
    )

    unseenMessages.forEach((msg) => {
      const messageRef = doc(
        db,
        'conversations',
        conversationId,
        'messages',
        msg.id,
      )
      batch.update(messageRef, { seen: true })
    })

    if (unseenMessages.length > 0) {
      try {
        await batch.commit()
      } catch (error) {
        console.error('Error marking messages as seen:', error)
      }
    }
  }

  const sendMessage = async () => {
    if (inputMessage.trim() === '') return

    const inputText = inputMessage
    setInputMessage('')
    const messageData = {
      text: inputText,
      senderId: loggedInUser.uid,
      timestamp: serverTimestamp(),
      seen: false,
    }

    try {
      const messageRef = await addDoc(
        collection(db, 'conversations', conversationId, 'messages'),
        messageData,
      )

      // Update the conversation document with the last message and increment unread count
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: inputText,
        lastMessageTimestamp: serverTimestamp(),
        [`unreadCount.${otherUserId}`]: increment(1),
      })
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    const now = new Date()
    const messageDate = new Date(timestamp)

    if (now.toDateString() === messageDate.toDateString()) {
      return messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else {
      return messageDate.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === loggedInUser.uid
    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage
            ? styles.ownMessageContainer
            : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          <Text
            style={[styles.messageText, isOwnMessage && styles.ownMessageText]}
          >
            {item.text}
          </Text>
        </View>
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
          {isOwnMessage && (
            <Ionicons
              name={item.seen ? 'checkmark-done' : 'checkmark'}
              size={16}
              color={item.seen ? Theme.primaryColor.color : '#888'}
            />
          )}
        </View>
      </View>
    )
  }

  const customHandlePress = () => {
    navigation.navigate('myTabs', { screen: 'Messages' })
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        <BackArrow onPress={customHandlePress} />
        <View style={styles.header}>
          <Image
            source={{ uri: otherUser.profileImage || DEFAULT_AVATAR }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{otherUser.fullname}</Text>
        </View>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size='large' color={Theme.primaryColor.color} />
          </View>
        ) : (
          <FlatList
            inverted
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
          />
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder='Type a message...'
          />
          <Pressable onPress={sendMessage} style={styles.sendButton}>
            <Ionicons name='send' size={24} color={Theme.primaryColor.color} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: Platform.OS === 'ios' ? 'row' : 'row-reverse',
    alignItems: 'center',
    padding: 10,
    marginTop: VerticalScale(50),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    justifyContent: 'center',
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    ...(Platform.OS === 'ios' && {
      marginLeft: HorizontalScale(10),
    }),
    ...(Platform.OS === 'android' && {
      marginRight: HorizontalScale(10),
    }),
    // marginLeft: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    ...(Platform.OS === 'ios' && {
      marginLeft: HorizontalScale(10),
    }),
    ...(Platform.OS === 'android' && {
      marginRight: HorizontalScale(10),
    }),
    // marginLeft: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  messageContainer: {
    marginVertical: VerticalScale(5),
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: Platform.OS === 'ios' ? 'flex-end' : 'flex-start',
  },
  otherMessageContainer: {
    alignSelf: Platform.OS === 'ios' ? 'flex-start' : 'flex-end',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 20,
  },
  ownMessage: {
    backgroundColor: Theme.primaryColor.color,
  },
  otherMessage: {
    backgroundColor: '#eee',
  },
  messageText: {
    color: '#333',
  },
  ownMessageText: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: VerticalScale(2),
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    ...(Platform.OS === 'ios' && {
      marginRight: HorizontalScale(5),
    }),
    ...(Platform.OS === 'android' && {
      marginLeft: HorizontalScale(5),
    }),
    // marginRight: 5,
  },
  inputContainer: {
    flexDirection: Platform.OS === 'ios' ? 'row' : 'row-reverse',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: HorizontalScale(15),
    paddingVertical: VerticalScale(10),
    ...(Platform.OS === 'ios' && {
      marginRight: HorizontalScale(10),
    }),
    ...(Platform.OS === 'android' && {
      marginLeft: HorizontalScale(10),
    }),
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    // marginRight:5,
  },
})

export default ChatPage
