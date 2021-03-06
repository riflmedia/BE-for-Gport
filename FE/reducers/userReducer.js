export default function reducer(state={
    id: null,
    name: null,
    email: null,
    type: null,
    photos: null,
    fetching: false,
    fetched: false,
    error: null,
  }, action) {

    switch (action.type) {
      case "FETCH_USER": {
        return {...state, fetching: true}
      }
      case "FETCH_USER_REJECTED": {
        return {...state, fetching: false, error: action.payload}
      }
      case "FETCH_USER_FULFILLED": {
        return {
          ...state,
          fetching: false,
          fetched: true,
          user: action.payload,
        }
      }
      case "SET_USER_NAME": {
        return {
          ...state,
          ...state.user, name: action.payload,
        }
      }
      case "SET_USER_EMAIL": {
        return {
          ...state,
          ...state.user, email: action.payload,
        }
      }
      case "SET_USER_TYPE": {
        return {
          ...state,
          ...state.user, type: action.payload,
        }
      }
      case "SET_USER_PARAMS": {
        if(action.payload && action.payload.facebook){
          return {
            ...state,
            ...state.user, type: 'facebook', name: action.payload.facebook.name, email: action.payload.facebook.email, photos: action.payload.facebook.photos, id: action.payload.facebook.id,
          }
        }else if(action.payload && action.payload.twitter){
          return {
            ...state,
            ...state.user, type: 'twitter', name: action.payload.twitter.name, email: action.payload.twitter.email, photos: action.payload.twitter.photos,  id: action.payload.twitter.id,
          }
        }else if(action.payload && action.payload.google){
          return {
            ...state,
           ...state.user, type: 'google', name: action.payload.google.name, email: action.payload.google.email, photos: action.payload.google.photos,  id: action.payload.google.id,
          }
        }else if(action.payload && action.payload.vk){
          return {
            ...state,
           ...state.user, type: 'vk', name: action.payload.vk.name, email: action.payload.vk.email, photos: action.payload.vk.photos,  id: action.payload.vk.id,
          }
        }else if(action.payload && action.payload.odnoklassniki){
          return {
            ...state,
           ...state.user, type: 'odnoklassniki', name: action.payload.odnoklassniki.name, email: action.payload.odnoklassniki.email, photos: action.payload.odnoklassniki.photos,  id: action.payload.odnoklassniki.id,
          }
        }else if(action.payload && action.payload.login){
          return {
            ...state,
           ...state.user, type: 'login', name: action.payload.login.name, email: action.payload.login.email, id: action.payload.login.id,
          }
        }else{
          return {
            ...state,
            ...state.user, type: 'guest', name: action.payload.guest.name, email: action.payload.guest.email, id: action.payload.guest.id,
          }
        }
      }
    }
    return state
}
