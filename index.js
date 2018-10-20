const fetch = require('node-fetch')
const sprintf = require("sprintf-js").sprintf
// const promisify = require("util").promisify

const manga_url = "https://myanimelist.net/mangalist/{!user!}/load.json?offset={!offset!}&status={!status!}"
const status_table = {
  reading: 1,
  completed: 2,
  on_hold: 3,
  dropped: 4,
  plan_to_read: 6,
}

let list = []

// NOTE: CONFIG
const user = "kahlk"
const status = status_table.plan_to_read
const min_chapter = 100
const max_chapter = 9999

const sort_factor = -1
// NOTE: CONFIG END

main()

async function main(){
  do{
    console.log("fetching for user:", user, "with offset:", list.length)
  }while(await fetchFromMal(user, list.length, status))
  console.log("A total of", list.length, "manga found for ", user)

  let min_chpt = Number.MAX_SAFE_INTEGER
  let max_chpt = 0
  let title_length = 0

  let ignored = []

  list = list
    .filter(i => {
      let chpts = i.manga_num_chapters
      if(chpts < min_chpt){
        min_chpt = chpts
      }
      if(chpts > max_chpt){
        max_chpt = chpts
      }
      return chpts !== 0 &&
        chpts >= min_chapter &&
        chpts <= max_chapter
    })
    .map(i => {return {title: i.manga_title, chapters: i.manga_num_chapters}})
    .sort((a, b) => {
      let co = sort_factor * (a.chapters - b.chapters)
      if(co === 0){
        return `${a.title}`.localeCompare(`${b.title}`)
      }
      return co
    })
    .filter(i => {
      let ign = ignore.indexOf(i.title) > -1
      if(ign){
        ignored.push(i)
      }
      return !ign
    })

  for(let i of list){
    let tl = i.title.length
    if(tl > title_length){
      title_length = tl
    }
  }

  const sprint_str = `%-${title_length}s | %8s`
  let header = sprintf(sprint_str, "Title", "Chapters")

  console.log("Min chapters:", min_chpt, "| Max chapters:", max_chpt)

  console.log("\nIgnored:")
  console.log(header)
  console.log("-".repeat(header.length))
  for(let i of ignored) {
    console.log(sprintf(sprint_str, i.title, i.chapters))
  }

  console.log()
  console.log(header)
  console.log("-".repeat(header.length))
  for(let i of list){
    console.log(sprintf(sprint_str, i.title, i.chapters))
  }

  console.log("\nItems after filter:", list.length)
}

async function fetchFromMal(user, offset, status){
  let url = manga_url
    .replace("{!user!}", user)
    .replace("{!offset!}", offset)
    .replace("{!status!}", status)
  
  let r = await fetch(url)
  if(r.status !== 200){
    console.error("Mal returned with:", r.status, r.statusText)
  }
  let partial_list = await r.json()
  if(partial_list.length <= 0){
    return false
  }
  list = list.concat(partial_list)
  return true
}

const ignore = [
  "Ai no Kenkyuu",
  "Watashi no Suki na Senpai",
  "Tomodachi",
  "Suuji Danshi x Renai Shoujo",
  "Futometic Love",
  "Niizuma Danshi",
  "E no Genten",
  "Mappa Teacher",
  "Gensou Kojiki Den",
  "Gochuumon wa, Okimari desu ka.",
  "Kotodama Koro koro",
  "Koi no Sankaku",
  "Relieving Stress",
  "Hisesshoku-kei Lovers",
]
