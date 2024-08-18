import React, { useState, useContext, useEffect } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  Alert,  Platform, 
  StatusBar
} from 'react-native'
import Theme from '../../../assets/styles/theme'
import { VerticalScale, HorizontalScale } from '../../utils'
import axios from 'axios'
import { AuthContext } from '../../../AuthContext'
import Header from '../../components/Header/header'
import SingleTrip from '../../components/SingleTrip/singleTrip'
import Spinner from 'react-native-loading-spinner-overlay'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { useIsFocused } from '@react-navigation/native';


export default function MyTrips({ navigation }) {
  const { loggedInUser, logoutUser } = useContext(AuthContext)
  const [isLoading, setIsLoading] = useState(true)
  const [futureTrips, setFutureTrips] = useState([])
  const [pastTrips, setPastTrips] = useState([])
  const [error, setError] = useState(null)
  const isFocused = useIsFocused();

  const logOut = () => {
    logoutUser()
    navigation.navigate('Login')
    // console.log('logOut')
  }

  useEffect(() => {
    if (isFocused) {
      fetchAllTrips();
    }
  }, [isFocused]);

  useEffect(() => {
    fetchAllTrips()
  }, [])

  const fetchAllTrips = async () => {
    if (!loggedInUser || !loggedInUser.uid) {
      // console.log("No logged-in user")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.get(
        `https://us-central1-mateapiconnection.cloudfunctions.net/mateapi/getAllTrips`
      )
      // console.log('API Response:', response.data)

      const allTrips = response.data
      const userTrips = allTrips.filter(trip => 
        trip.manageByUid === loggedInUser.uid || 
        (trip.joinedUsers && trip.joinedUsers.some(user => user.uid === loggedInUser.uid))
      )

      // console.log('Filtered User Trips:', userTrips)

      const currentDate = new Date()

      const future = userTrips.filter(trip => new Date(trip.endDate) > currentDate)
      const past = userTrips.filter(trip => new Date(trip.endDate) <= currentDate)

      setFutureTrips(future)
      setPastTrips(past)
    } catch (error) {
      console.error('Error fetching trips:', error)
      // console.log('Error details:', error.response?.data)
      setError('Failed to load trips. Please try again.')
      Alert.alert('Error', 'Failed to load trips. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleHeaderPress = () => {
    navigation.navigate('ViewProfile', {
      profile: loggedInUser,
    })   }

  const renderTrip = ({ item }) => (
    <SingleTrip
      handlePress={() => navigation.navigate('ViewTrip', { trip: item })}
      picUrl={{ uri: item.tripPictureUrl || 'https://example.com/default-trip.png' }}
      title={item.tripName || 'Unnamed Trip'}
      destination={item.destinations || []}
      max={'/' + item.limitUsers || ''}
      numOfPeople={item.joinedUsers.length || 0}
      endDate={item.endDate}
    />
  )

  if (!loggedInUser) {
    return null
  }

  return (
    <SafeAreaView style={[Theme.screen, styles.screen,{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0}]}>
      <Spinner
        visible={isLoading}
        textContent={'Loading...'}
        textStyle={styles.spinnerText}
        overlayColor='rgba(0, 0, 0, 0.6)'
      />

      <View style={styles.topBar}>
        <Header
          onPress={handleHeaderPress}
          nickName={loggedInUser.fullname || 'Guest'}
          picUri={loggedInUser.profileImage || 'https://example.com/default-avatar.png'}
        />
        <Pressable style={styles.icon} onPress={logOut}>
          <AntDesign name='logout' size={30} color='#e6824a' />
          <Text>התנתק</Text>
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <View style={styles.content}>
            <Text style={[Theme.primaryTitle, styles.title]}>טיולים עתידיים</Text>
            <FlatList
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              data={futureTrips}
              renderItem={renderTrip}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={<Text style={styles.emptyText}>לא נמצאו טיולים עתידיים</Text>}
            />
          </View>

          <View style={styles.content}>
            <Text style={[Theme.primaryTitle, styles.title]}>טיולי עבר</Text>
            <FlatList
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              data={pastTrips}
              renderItem={renderTrip}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={<Text >לא נמצאו טיולי עבר</Text>}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  screen: { alignItems: 'center' },
  topBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    marginTop: VerticalScale(20),
  },
  spinnerText: {
    color: '#FFF',
  },
  content: {
    marginTop: VerticalScale(30),
    width: '90%',

  },
  title: { textAlign: 'right' },
  icon: {
    position: 'absolute',
    left: '0%',
    paddingHorizontal: HorizontalScale(5),
    borderRadius: 50,
    textAlign: 'center',
    alignItems: 'center',
  },
  emptyText:{
  },
})