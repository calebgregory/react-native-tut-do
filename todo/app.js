import React, { Component } from 'react'
import { View, StyleSheet, ActivityIndicator, Platform, ListView, Keyboard, AsyncStorage } from 'react-native'
import Header from './header'
import Footer from './footer'
import Row from './row'

const filterItems = (filter, items) => {
  return items.filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'COMPLETED') return item.complete;
    if (filter === 'ACTIVE') return !item.complete;
  })
}
export default class App extends Component {
  constructor(props) {
    super(props)
    const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 != r2 })
    this.state = {
      loading: true,
      allComplete: false,
      filter: 'ALL',
      value: '',
      items: [],
      dataSource: ds.cloneWithRows([])
    }
    this.handleFilter = this.handleFilter.bind(this)
    this.handleUpdateText = this.handleUpdateText.bind(this)
    this.handleToggleEditing = this.handleToggleEditing.bind(this)
    this.handleAddItem = this.handleAddItem.bind(this)
    this.handleRemoveItem = this.handleRemoveItem.bind(this)
    this.handleToggleAllComplete = this.handleToggleAllComplete.bind(this)
    this.handleToggleComplete = this.handleToggleComplete.bind(this)
    this.setSource = this.setSource.bind(this)
    this.handleClearComplete = this.handleClearComplete.bind(this)
  }

  componentWillMount() {
    AsyncStorage.getItem('items').then((json) => {
      try {
        const items = JSON.parse(json)
        this.setSource(items, items, { loading: false })
      } catch (e) {
        this.setState({loading: false})
      }
    })
  }

  handleUpdateText(key, text) {
    const newItems = this.state.items.map((item) => {
      if (item.key !== key) return item;
      return {
        ...item,
        text
      }
    })
    this.setSource(newItems, filterItems(this.state.filter, newItems))
  }

  handleToggleEditing(key, editing) {
    const newItems = this.state.items.map((item) => {
      if (item.key !== key) return item;
      return {
        ...item,
        editing
      }
    })
    this.setSource(newItems, filterItems(this.state.filter, newItems))
  }

  setSource(items, itemsDatasource, otherState={}) {
    this.setState({
      items,
      dataSource: this.state.dataSource.cloneWithRows(itemsDatasource),
      ...otherState
    })
    AsyncStorage.setItem('items', JSON.stringify(items))
  }

  handleClearComplete() {
    const newItems = filterItems('ACTIVE', this.state.items)
    this.setSource(newItems, filterItems(this.state.filter, newItems))
  }

  handleFilter(filter) {
    this.setSource(this.state.items, filterItems(filter, this.state.items), { filter })
  }

  handleToggleAllComplete() {
    const complete = !this.state.allComplete
    const nextItems = this.state.items.map((item) => ({
      ...item,
      complete
    }))
    this.setSource(nextItems, nextItems, { allComplete: complete })
  }

  handleToggleComplete(key, complete) {
    const nextItems = this.state.items.map((item) => {
      if (item.key != key) { return item; }
      return {
        ...item,
        complete
      }
    })
    this.setSource(nextItems, nextItems)
  }

  handleRemoveItem(key) {
    const newItems = this.state.items.filter((item) => item.key !== key)
    this.setSource(newItems, newItems)
  }

  handleAddItem() {
    if (!this.state.value) return;
    const nextItems = [
      ...this.state.items,
      {
        key: Date.now(),
        text: this.state.value,
        complete: false
      }
    ]
    this.setSource(nextItems, nextItems, { value: "" })
  }

  render() {
    return (
      <View style={styles.container}>
        <Header
          value={this.state.value}
          onAddItem={this.handleAddItem}
          onChange={(value) => this.setState({ value })}
          onToggleAllComplete={this.handleToggleAllComplete}
        />
        <View style={styles.content}>
          <ListView
            enableEmptySessions
            dataSource={this.state.dataSource}
            onScroll={() => Keyboard.dismiss()}
            renderRow={({ key, ...value }) => <Row
              key={key}
              onUpdate={(text) => this.handleUpdateText(key, text)}
              onToggleEdit={(editing) => this.handleToggleEditing(key, editing)}
              style={styles.row}
              onComplete={(complete) => this.handleToggleComplete(key, complete)}
              onRemove={() => this.handleRemoveItem(key)}
              { ...value }
            />}
            renderSeparator={(sectionId, rowId) => <View key={rowId} style={styles.separator} />}
          />
        </View>
        <Footer
          count={filterItems("ACTIVE", this.state.items).length}
          filter={this.state.filter}
          onFilter={this.handleFilter}
          onClearComplete={this.handleClearComplete}
        />
        {this.state.loading && <View style={styles.loading}>
          <ActivityIndicator
            animating
            size="large"
          />
        </View>}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    ...Platform.select({
      ios: { paddingTop: 30 }
    })
  },
  loading: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,.2)'
  },
  content: {
    flex: 1
  },
  list: {
    backgroundColor: "#FFFFFF"
  },
  separator: {
    borderWidth: 1,
    borderColor: "#F5F5F5"
  }
})
