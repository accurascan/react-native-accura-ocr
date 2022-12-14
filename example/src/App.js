import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  Platform,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Modal,
  LogBox,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  PermissionsAndroid
} from 'react-native';
import AccuraOcr from 'react-native-accura-ocr';
import { Dropdown } from 'react-native-material-dropdown-v2';
import Toast from 'react-native-simple-toast';


getOrientation = () => { if (Dimensions.get('window').width < Dimensions.get('window').height) { return 'portrait' } else { return 'landscape' } }
const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

export default class App extends React.Component {

  mrzSelected = '';
  mrzCountryList = 'all';
  countrySelected = null;
  cardSelected = null;
  barcodeSelected = '';
  facematchURI = '';
  newIndex = 0;
  language = 'en';

  constructor(props) {
    super(props);
    this.state = {
      isValid: false,
      isGetToken: false,
      objSDKRes: [],
      ocrContries: [],
      ocrCards: [],
      mrzDocuments: [
        { label: "Passport", value: "passport_mrz" },
        { label: "Mrz ID", value: "id_mrz" },
        { label: "Visa Card", value: "visa_mrz" },
        { label: "Other", value: "other_mrz" }
      ],
      barcodeTypes: [],
      objScanRes: [],
      modalVisible: false,
      ocrCardName: "",

      secondImageURI: '',
      fm_score: 0.0,
      lv_score: 0.0,

      isValidCountry: true,
      isValidCard: true,
      isValidType: true,
      isValidBarcodeType: true,
      isLoading: true
    };
  }

  requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.CAMERA, PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]);
      console.log("granted:- ", granted)
      if (granted["android.permission.CAMERA"] === "granted" && granted["android.permission.WRITE_EXTERNAL_STORAGE"] === "granted" && granted["android.permission.RECORD_AUDIO"] === "granted") {
        console.log("You can use the camera");
        return true
      } else {
        console.log("Camera permission denied");
        return false
      }
    } catch (err) {
      console.warn(err);
    }
  };

  checkRequestCameraPermission = async () => {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("checkRequestCameraPermission TRUE")
      return true
    } else {
      console.log("checkRequestCameraPermission FALSE")
      return false
    }
  }

  checkRequestWritePermission = async () => {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("checkRequestWritePermission TRUE")
      return true
    } else {
      console.log("checkRequestWritePermission FALSE")
      return false
    }
  }


  componentDidMount = () => {

    LogBox.ignoreAllLogs();
    console.log("IS_ACTIVE_ACCURA_KYC:- ", AccuraOcr.getConstants());
    this.setUpCustomMessages()
    if (Platform.OS == 'ios') {
      this.getAccuraSetup()
    } else {
      if (this.requestPermissions()) {
        this.getAccuraSetup()
      } else {
        this.setState({ isLoading: false })
      }
    }
  }

  setUpCustomMessages = () => {

    var config = {
      ACCURA_ERROR_CODE_MOTION: this.language == 'en' ? 'Keep Document Steady' : '???????? ?????? ???????? ??????????????',
      ACCURA_ERROR_CODE_DOCUMENT_IN_FRAME: this.language == 'en' ? 'Keep document in frame' : '?????????? ???????????????? ???? ????????????',
      ACCURA_ERROR_CODE_BRING_DOCUMENT_IN_FRAME: this.language == 'en' ? 'Bring card near to frame' : '?????????? ?????????????? ???????????? ???? ????????????',
      ACCURA_ERROR_CODE_PROCESSING: this.language == 'en' ? 'Processing???' : '?????????????',
      ACCURA_ERROR_CODE_BLUR_DOCUMENT: this.language == 'en' ? 'Blur detect in document' : '?????? ?????????????? ???? ??????????????',
      ACCURA_ERROR_CODE_FACE_BLUR: this.language == 'en' ? 'Blur detected over face' : '???? ?????????? ???? ???????????? ?????? ??????????',
      ACCURA_ERROR_CODE_GLARE_DOCUMENT: this.language == 'en' ? 'Glare detect in document' : '?????? ?????????? ???? ??????????????',
      ACCURA_ERROR_CODE_HOLOGRAM: this.language == 'en' ? 'Hologram Detected' : '???? ?????????? ???? ???????? ???????????? ??????????????',
      ACCURA_ERROR_CODE_DARK_DOCUMENT: this.language == 'en' ? 'Low lighting detected' : '???? ?????????? ???? ?????????? ????????????',
      ACCURA_ERROR_CODE_PHOTO_COPY_DOCUMENT: this.language == 'en' ? 'Can not accept Photo Copy Document' : '???? ???????? ???????? ?????????? ?????? ??????????',
      ACCURA_ERROR_CODE_FACE: this.language == 'en' ? 'Face not detected' : '???? ?????? ?????????? ???? ??????????',
      ACCURA_ERROR_CODE_MRZ: this.language == 'en' ? 'MRZ not detected' : '???? ?????? ?????????? ???? MRZ',
      ACCURA_ERROR_CODE_PASSPORT_MRZ: this.language == 'en' ? 'Passport MRZ not detected' : '???? ?????? ?????????? ???? MRZ ???????? ??????',
      ACCURA_ERROR_CODE_ID_MRZ: this.language == 'en' ? 'ID card MRZ not detected' : '???? ?????? ?????????? ???? ?????????? ???????????? MRZ',
      ACCURA_ERROR_CODE_VISA_MRZ: this.language == 'en' ? 'Visa MRZ not detected' : '???? ?????? ?????????? ???? Visa MRZ',
      ACCURA_ERROR_CODE_WRONG_SIDE: this.language == 'en' ? 'Scanning wrong side of document' : '?????? ???????????? ?????????? ???? ??????????????',
      ACCURA_ERROR_CODE_UPSIDE_DOWN_SIDE: this.language == 'en' ? 'Document is upside down. Place it properly' : '?????????????? ??????????. ?????? ???????? ????????',

      IS_SHOW_LOGO: false,
      SCAN_TITLE_OCR_FRONT: this.language == 'en' ? 'Scan Front Side of' : '?????? ???????????? ?????????????? ????',
      SCAN_TITLE_OCR_BACK: this.language == 'en' ? 'Scan Back Side of' : '?????? ???????????? ???????????? ????',
      SCAN_TITLE_OCR: this.language == 'en' ? 'Scan' : '??????',
      SCAN_TITLE_BANKCARD: this.language == 'en' ? 'Scan Bank Card' : '?????? ?????????????? ????????????????',
      SCAN_TITLE_BARCODE: this.language == 'en' ? 'Scan Barcode' : '?????? ?????????? ??????????????',
      SCAN_TITLE_MRZ_PDF417_FRONT: this.language == 'en' ? 'Scan Front Side of Document' : '?????? ?????????? ?????????????? ??????????????',
      SCAN_TITLE_MRZ_PDF417_BACK: this.language == 'en' ? 'Now Scan Back Side of Document' : '???????? ?????? ???????????? ???????????? ???? ??????????????',
      SCAN_TITLE_DLPLATE: this.language == 'en' ? 'Scan Number Plate' : '?????? ?????? ????????????'
    };
    AccuraOcr.setupAccuraConfig([config], (error, response) => {
      if (error != null) {
        console.log("Failur!", error);
      } else {
        console.log("Message:- ", response)
      }
    })
  }

  getAccuraSetup = () => {

    AccuraOcr.getMetaData((error, response) => {
      if (error != null) {
        console.log("Failur!", error);
        this.setState({ isLoading: false })
      } else {
        res = this.getResultJSON(response)
        console.log("JSON:- ", response)
        // console.log("JSON:- ", res.countries)
        // console.log("JSON:- ", res.countries[0].cards)

        var newContries = []
        res?.countries?.map(item => newContries = [...newContries, { label: item.name, value: item.id }])

        var newBarcodeTypes = []
        res?.barcodes?.map(item => newBarcodeTypes = [...newBarcodeTypes, { label: item.name, value: item.type }])
        this.setState({ objSDKRes: res, ocrContries: newContries, isValid: res.isValid, barcodeTypes: newBarcodeTypes, isLoading: false })
      }
    })
  }

  componentWillUnmount = () => {

  }

  showAlert = ((title, message) => {

    // Toast.showWithGravity(message, Toast.LONG, Toast.TOP);
    // Toast.show(message, Toast.LONG);
    if (Platform.OS == 'ios') {
      Alert.alert(title, message, [{ text: "OK", onPress: () => console.log("Cancel Pressed"), style: "cancel" }])
    } else {
      Toast.show(message, Toast.LONG);
    }
  });

  getResultJSON = (jsonString) => {

    console.log("JSON String:- ", jsonString)
    var json;
    try {
      json = eval(jsonString);
    } catch (exception) {
      try {
        json = JSON.parse(jsonString);
      } catch (exception) {
        json = null;
        console.log("NOT VAID JSON")
      }
    }

    if (json) {
      console.log("VAID JSON")
      return json
    }
    return null;
  }

  onPressOCR = () => {

    var isValid = true
    if (this.countrySelected == null || this.countrySelected == "") {
      this.setState({ isValidCountry: false })
      isValid = false
    }

    if (this.cardSelected == null || this.cardSelected == "") {
      this.setState({ isValidCard: false })
      isValid = false
    }

    if (isValid) {

      let passArgs = [{ enableLogs: false }, this.countrySelected.id, this.cardSelected.id, this.cardSelected.name, this.cardSelected.type, getOrientation()] //[{"enableLogs":false},1,41,"Emirates National ID",0,"portrait-primary"]
      console.log("passArgs:- ", passArgs)
      AccuraOcr.startOcrWithCard(passArgs, (error, response) => {
        if (error != null) {
          console.log("Failur!", error);
          this.showAlert("Failur!", error)
        } else {
          res = this.getResultJSON(response)
          console.log("JSON:- ", res)
          this.setState({ modalVisible: true, objScanRes: res })
        }
      })
    }
  }

  onPressMRZ = () => {

    var isValid = true
    if (this.mrzSelected == "" || this.mrzSelected == null) {
      this.setState({ isValidType: false })
      isValid = false
    }

    if (isValid) {

      let passArgs = [{ enableLogs: false }, this.mrzSelected, this.mrzCountryList, getOrientation()]
      console.log("passArgs:- ", passArgs)
      AccuraOcr.startMRZ(passArgs, (error, response) => {
        if (error != null) {
          console.log("Failur!", error);
          this.showAlert("Failur!", error)
        } else {
          res = this.getResultJSON(response)
          console.log("JSON:- ", res)
          this.setState({ modalVisible: true, objScanRes: res })
        }
      })
    }
  }

  onPressBarcode = () => {

    var isValid = true
    console.log("this.barcodeSelected:- ", this.barcodeSelected)
    if (this.barcodeSelected?.toString() == "") {
      this.setState({ isValidBarcodeType: false })
      isValid = false
    }

    if (isValid) {

      let passArgs = [{ enableLogs: false }, this.barcodeSelected, getOrientation()]
      console.log("passArgs:- ", passArgs)
      AccuraOcr.startBarcode(passArgs, (error, response) => {
        if (error != null) {
          console.log("Failur!", error);
          this.showAlert("Failur!", error)
        } else {
          res = this.getResultJSON(response)
          console.log("JSON:- ", res)
          this.setState({ modalVisible: true, objScanRes: res })
        }
      });
    }
  }

  onPressBankcard = () => {

    let passArgs = [{ enableLogs: false }, getOrientation()]
    console.log("passArgs:- ", passArgs)
    AccuraOcr.startBankCard(passArgs, (error, response) => {
      if (error != null) {
        console.log("Failur!", error);
        this.showAlert("Failur!", error)
      } else {
        res = this.getResultJSON(response)
        console.log("JSON:- ", res)
        this.setState({ modalVisible: true, objScanRes: res })
      }
    });
  }

  render() {
    return (
      <ImageBackground source={require('./assets/images/background.png')} style={styles.backgroundView}>
        {
          this.state.isLoading ?
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#d32d38" />
            </View>
            :
            <>
              {
                <SafeAreaView>
                  <ScrollView>
                    <View style={styles.container}>
                      <Image source={require('./assets/images/logo.png')} style={styles.logoView} />
                      {
                        this.state.isValid ?
                          <>
                            {
                              this.state.objSDKRes?.isOCR ?
                                <View style={[styles.viewOption, { height: 270 }]}>
                                  <Text style={styles.optionTitle}>{'Scan OCR Documents'}</Text>
                                  <Dropdown
                                    style={{ width: windowWidth * 0.75, backgroundColor: 'none', marginTop: -20 }}
                                    label='Select Country'
                                    data={this.state.ocrContries}
                                    onChangeText={(value, index) => {

                                      console.log("Inex:- ", index, "value:- ", value)
                                      this.countrySelected = this.state.objSDKRes?.countries[index];
                                      console.log("Country:- ", this.countrySelected)
                                      this.cardSelected = null

                                      var selectedCountry = this.state.objSDKRes?.countries[index];
                                      var newCards = []
                                      selectedCountry?.cards?.map(item => newCards = [...newCards, { label: item.name, value: item.id }])
                                      this.setState({ ocrCards: newCards, isValidCountry: true, ocrCardName: "" })
                                    }}
                                  />
                                  {!this.state.isValidCountry ? <Text style={styles.lblError}>{'Please select country first.'}</Text> : <View />}
                                  <Dropdown
                                    style={{ width: windowWidth * 0.75, backgroundColor: 'none', marginTop: -20 }}
                                    label='Select Card'
                                    value={this.state.ocrCardName}
                                    data={this.state.ocrCards}
                                    onChangeText={(value, index) => {
                                      console.log("Inex:- ", index, "value:- ", value)
                                      this.cardSelected = this.countrySelected.cards[index];
                                      console.log("Card:- ", this.cardSelected)
                                      this.setState({ isValidCard: true, ocrCardName: this.countrySelected.cards[index].name })
                                    }}
                                  />
                                  {!this.state.isValidCard ? <Text style={styles.lblError}>{'Please select card first.'}</Text> : <View />}
                                  <TouchableOpacity style={styles.optionButton} onPress={this.onPressOCR} >
                                    <Text style={styles.optionButtonText}>Start OCR</Text>
                                  </TouchableOpacity>
                                </View> : <View />
                            }

                            {
                              this.state.objSDKRes?.isMRZ ?
                                <View style={[styles.viewOption]}>
                                  <Text style={styles.optionTitle}>{'Scan MRZ Documents'}</Text>
                                  <Dropdown
                                    style={{ width: windowWidth * 0.75, backgroundColor: 'none', marginTop: -20 }}
                                    label='Select Type'
                                    data={this.state.mrzDocuments}
                                    onChangeText={(value, index) => {
                                      console.log("Inex:- ", index, "value:- ", value)
                                      this.mrzSelected = value;
                                      this.setState({ isValidType: true })
                                    }}
                                  />
                                  {!this.state.isValidType ? <Text style={styles.lblError}>{'Please select MRZ type first.'}</Text> : <View />}
                                  <TouchableOpacity style={styles.optionButton} onPress={this.onPressMRZ} >
                                    <Text style={styles.optionButtonText}>Start MRZ</Text>
                                  </TouchableOpacity>
                                </View> : <View />
                            }

                            {
                              this.state.objSDKRes?.isBarcode ?
                                <View style={[styles.viewOption]}>
                                  <Text style={styles.optionTitle}>{'Scan Barcode'}</Text>
                                  <Dropdown
                                    style={{ width: windowWidth * 0.75, backgroundColor: 'none', marginTop: -20 }}
                                    label='Select Type'
                                    data={this.state.barcodeTypes}
                                    onChangeText={(value, index) => {
                                      console.log("Inex:- ", index, "value:- ", value)
                                      this.barcodeSelected = value;
                                      this.setState({ isValidBarcodeType: true })
                                    }}
                                  />
                                  {!this.state.isValidBarcodeType ? <Text style={styles.lblError}>{'Please select barcode type first.'}</Text> : <View />}
                                  {/* <Text style={{ color: 'white', textAlign: 'center' }}>{'You can scan any barcode here by tap on "Start Barcode" button.'}</Text> */}
                                  <TouchableOpacity style={styles.optionButton} onPress={this.onPressBarcode} >
                                    <Text style={styles.optionButtonText}>Start Barcode</Text>
                                  </TouchableOpacity>
                                </View> : <View />
                            }

                            {
                              this.state.objSDKRes?.isBankCard ?
                                <View style={[styles.viewOption, { height: 170 }]}>
                                  <Text style={styles.optionTitle}>{'Scan Bankcard'}</Text>
                                  <Text style={styles.optionDescription}>{'You can scan any bank card here by tap on "Start Bankcard" button.'}</Text>
                                  <TouchableOpacity style={styles.optionButton} onPress={this.onPressBankcard} >
                                    <Text style={styles.optionButtonText}>Start Bankcard</Text>
                                  </TouchableOpacity>
                                </View> : <View />
                            }
                          </>
                          :
                          <View style={{ height: windowHeight * 0.6, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('./assets/images/license.png')} style={styles.licenseView} />
                            <Text style={styles.optionDescription}>{'License you provided for sacnning is invalid.'}</Text>
                            <Text style={{ textDecorationLine: 'underline', fontSize: 16, marginTop: 10 }}>{'www.accurascan.com'}</Text>
                          </View>
                      }
                    </View>
                  </ScrollView>
                </SafeAreaView>
              }
            </>
        }
        {this.generateResult(this.state.objScanRes)}
      </ImageBackground>
    );
  }

  generateResult = (result) => {

    if (result == undefined || result == null) {
      return
    }

    if (result.hasOwnProperty("face")) {
      this.facematchURI = result?.face;
    }
    var sides = ["front_data", "back_data"];

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={this.state.modalVisible}
        onRequestClose={() => {
          this.setState({ modalVisible: false, secondImageURI: "", lv_score: 0.0, fm_score: 0.0 })
        }}>
        <View style={{ flex: 1, padding: 20, backgroundColor: '#00000066' }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalView}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 23, color: '#d22c39' }}>Accura Result</Text>
                <TouchableOpacity style={{}} onPress={() => this.setState({ modalVisible: false, secondImageURI: "", lv_score: 0.0, fm_score: 0.0 })} >
                  <Text style={{ fontSize: 28, fontWeight: 'bold' }}>???</Text>
                </TouchableOpacity>
              </View>
              {
                result.hasOwnProperty("face") ?
                  <View style={styles.modelFace}>
                    <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                      <Image style={styles.faceImageView} source={{ uri: result?.face }} />
                      {
                        this.state.secondImageURI !== "" ?
                          <Image style={[styles.faceImageView, { marginLeft: 50 }]} source={{ uri: this.state.secondImageURI }} />
                          : <View />
                      }
                    </View>
                  </View>
                  : <View />
              }

              <View style={{ marginTop: 0 }}>
                {
                  sides.map((side, index) => {
                    return (
                      <View key={index.toString()}>
                        {
                          result.hasOwnProperty(side) ?
                            Object.keys(result[side]).length > 0 ?
                              <View>
                                {
                                  (index === 0) ?
                                    <View style={styles.dataHeader}>
                                      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{this.getResultType(result?.type)}</Text>
                                    </View>
                                    :
                                    <View style={styles.dataHeader}>
                                      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{'OCR Back'}</Text>
                                    </View>
                                }
                                {
                                  Object.keys(result[side]).map((key, index) => {
                                    return (
                                      <View key={index.toString()}>
                                        {
                                          (key !== "PDF417") ?
                                            (!["signature", "front_img", "back_img"].includes(key)) ?
                                              (result.type == 'MRZ') ?
                                                <View style={styles.dataItem}>
                                                  <Text style={styles.lblDataTitle}>{this.getMRZLable(key)}</Text>
                                                  <Text style={styles.lblDataText}>{result[side][key].toString()}</Text>
                                                </View>
                                                :
                                                <View style={styles.dataItem}>
                                                  <Text style={styles.lblDataTitle}>{key}</Text>
                                                  <Text style={styles.lblDataText}>{result[side][key].toString()}</Text>
                                                </View>
                                              :
                                              (key === "signature") ?
                                                <View style={styles.dataItem}>
                                                  <Text style={styles.lblDataTitle}>{key}</Text>
                                                  <Image style={styles.signatureImage} source={{ uri: result[side][key] }} />
                                                </View>
                                                :
                                                <View />
                                            :
                                            <View />
                                        }
                                      </View>
                                    );
                                  })
                                }
                                {
                                  (result[side].hasOwnProperty("PDF417")) ?
                                    <View style={styles.dataItem}>
                                      <Text style={styles.lblDataTitle}>{key}</Text>
                                      <Text style={styles.lblDataText}>{result[side][key].toString()}</Text>
                                    </View>
                                    :
                                    <View />
                                }
                              </View>
                              :
                              <View />
                            :
                            <View />
                        }
                      </View>
                    );
                  })
                }
                {
                  (result.hasOwnProperty('mrz_data')) ?
                    (Object.keys(result.mrz_data).length > 0) ?
                      <>
                        {/* result.mrz_data.hasOwnProperty("MRZ") ?
                          <View style={styles.dataItem}>
                            <Text style={styles.lblDataTitle}>{'MRZ'}</Text>
                            <Text style={styles.lblDataText}>{result[side][key].toString()}</Text>
                          </View>
                        :
                        <View /> */}
                        <View style={styles.dataHeader}>
                          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{'MRZ'}</Text>
                        </View>
                        {
                          Object.keys(result.mrz_data).map((key, index) => {
                            return (
                              <View style={styles.dataItem} key={index.toString()}>
                                <Text style={styles.lblDataTitle}>{this.getMRZLable(key)}</Text>
                                <Text style={styles.lblDataText}>{result.mrz_data[key].toString()}</Text>
                              </View>
                            );
                          })
                        }
                      </>
                      :
                      <View />
                    :
                    <View />
                }
              </View>
              {
                result.hasOwnProperty("front_img") ?
                  <View>
                    <View style={styles.dataHeader}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{'FRONT SIDE'}</Text>
                    </View>
                    <View style={{ marginVertical: 10, borderRadius: 10 }}>
                      <Image style={styles.cardImage} source={{ uri: result.front_img }} />
                    </View>
                  </View>
                  :
                  <View />
              }

              {
                result.hasOwnProperty("back_img") ?
                  <View>
                    <View style={styles.dataHeader}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{'BACK SIDE'}</Text>
                    </View>
                    <View style={{ marginVertical: 10, borderRadius: 10 }}>
                      <Image style={styles.cardImage} source={{ uri: result.back_img }} />
                    </View>
                  </View>
                  :
                  <View />
              }

              {/* <View style={{  }}>
                <View style={styles.dataHeader}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{'MRZ'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.lblDataTitle}>{'MRZ'}</Text>
                  <Text style={styles.lblDataText}>{'P<TTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<L898902C36TTO7408122M1204159ZE184226B<<<<<10'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.lblDataTitle}>{'MRZ'}</Text>
                  <Image style={styles.signatureImage} source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Toni_Schumacher_-_Signatur.jpg' }} />
                </View>
                <View style={styles.dataHeader}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{'FRONT SIDE'}</Text>
                </View>
                <View style={{ marginVertical: 10, borderRadius: 10 }}>
                  <Image style={styles.cardImage} source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Toni_Schumacher_-_Signatur.jpg' }} />
                </View>
                <View style={styles.dataHeader}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{'BACK SIDE'}</Text>
                </View>
                <View style={{ marginVertical: 10, borderRadius: 10 }}>
                  <Image style={styles.cardImage} source={{ uri: 'https://aw.visa.com/dam/VCOM/regional/lac/ENG/Default/Pay%20With%20Visa/Find%20a%20Card/Debit%20Cards/Visa%20Debit%20Gold/debit-gold-eng-640x404.jpg' }} />
                </View>
              </View> */}

            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  getResultType = (type) => {
    switch (type) {
      case "BANKCARD":
        return "Bank Card Data";
      case "DL_PLATE":
        return "Vehicle Plate";
      case "BARCODE":
        return "Barcode Data";
      case "PDF417":
        return "PDF417 Barcode";
      case "OCR":
        return "OCR Front";
      case "MRZ":
        return "MRZ";
      case "BARCODEPDF417":
        return "USA DL Result";
      default:
        return "Front Side";
    }
  }

  getMRZLable = (key) => {

    var lableText = "";
    switch (key) {
      case "mrz":
        lableText += "MRZ";
        break;
      case "placeOfBirth":
        lableText += "Place Of Birth";
        break;
      case "retval":
        lableText += "Retval";
        break;
      case "givenNames":
        lableText += "First Name";
        break;
      case "country":
        lableText += "Country";
        break;
      case "surName":
        lableText += "Last Name";
        break;
      case "expirationDate":
        lableText += "Date of Expiry";
        break;
      case "passportType":
        lableText += "Document Type";
        break;
      case "personalNumber":
        lableText += "Other ID";
        break;
      case "correctBirthChecksum":
        lableText += "Correct Birth Check No.";
        break;
      case "correctSecondrowChecksum":
        lableText += "Correct Second Row Check No.";
        break;
      case "personalNumberChecksum":
        lableText += "Other Id Check No.";
        break;
      case "secondRowChecksum":
        lableText += "Second Row Check No.";
        break;
      case "expirationDateChecksum":
        lableText += "Expiration Check No.";
        break;
      case "correctPersonalChecksum":
        lableText += "Correct Document check No.";
        break;
      case "passportNumber":
        lableText += "Document No.";
        break;
      case "correctExpirationChecksum":
        lableText += "Correct Expiration Check No.";
        break;
      case "sex":
        lableText += "Sex";
        break;
      case "birth":
        lableText += "Date Of Birth";
        break;
      case "birthChecksum":
        lableText += "Birth Check No.";
        break;
      case "personalNumber2":
        lableText += "Other ID2";
        break;
      case "correctPassportChecksum":
        lableText += "Correct Document check No.";
        break;
      case "placeOfIssue":
        lableText += "Place Of Issue";
        break;
      case "nationality":
        lableText += "Nationality";
        break;
      case "passportNumberChecksum":
        lableText += "Document check No.";
        break;
      case "issueDate":
        lableText += "Date Of Issue";
        break;
      case "departmentNumber":
        lableText += "Department No.";
        break;
      default:
        lableText += key;
        break;
    }
    return lableText;
  }


}

const styles = StyleSheet.create({

  container: {
    flex: 1, marginHorizontal: 20, marginVertical: 10,
    alignItems: 'center'
  },
  backgroundView: {
    flex: 1
  },
  logoView: {
    width: 180,
    height: 90,
    marginTop: 10,
    resizeMode: 'stretch',
  },
  viewOption: {
    width: '100%',
    marginVertical: 20,
    height: 210,
    borderRadius: 20,
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    elevation: 3,
  },
  optionTitle: {
    color: '#d32d38', fontWeight: 'bold', fontSize: 20
  },
  licenseView: {
    width: 180,
    height: 180,
    marginVertical: 10,
    resizeMode: 'stretch',
  },
  optionDescription: {
    color: '#d22c39', fontWeight: 'bold', fontSize: 17, textAlign: 'center'
  },
  optionButton: {
    backgroundColor: 'black', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    elevation: 3,
  },
  optionButtonText: {
    fontWeight: 'bold', color: 'white'
  },
  optionDescription: {
    color: 'black', textAlign: 'center'
  },
  lblError: {
    textAlign: 'left', width: '100%', fontSize: 12, color: 'red', marginTop: -8, paddingHorizontal: 10
  },
  modalView: {
    backgroundColor: 'white', borderRadius: 10, padding: 20, flex: 1
  },
  modelFace: {
    alignItems: 'center', justifyContent: 'space-between', marginBottom: 20
  },
  faceImageView: {
    height: 140, width: 100, borderRadius: 10, backgroundColor: 'lightgrey'
  },
  btnView: {
    flexDirection: 'row', backgroundColor: '#d22c39', width: 130, paddingVertical: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 5
  },
  dataHeader: {
    width: '100%', backgroundColor: 'lightgrey', padding: 10
  },
  dataItem: {
    width: '100%', borderBottomColor: 'lightgrey', borderBottomWidth: 1, paddingHorizontal: 5, paddingVertical: 10, flexDirection: 'row', alignItems: 'center'
  },
  lblDataTitle: {
    fontSize: 16, color: '#d22c39', flex: 2, paddingHorizontal: 5
  },
  lblDataText: {
    fontSize: 16, flex: 3
  },
  signatureImage: {
    aspectRatio: 3 / 2, width: '50%', borderRadius: 10, resizeMode: 'contain', alignSelf: 'flex-start'
  },
  cardImage: {
    aspectRatio: 3 / 2, width: '100%', borderRadius: 10, resizeMode: 'contain', backgroundColor: 'lightgrey'
  },
  offlineContainer: {
    height: Dimensions.get('window').height,
    backgroundColor: '#0e3360',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  offlineText: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
  },
  offlineHint: {
    fontSize: 18,
    fontWeight: '300',
    color: 'gray'
  },
});