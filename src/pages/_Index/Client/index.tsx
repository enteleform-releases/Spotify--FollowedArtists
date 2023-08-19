//###  NPM  ###//
import {Buffer } from "buffer"
import {orderBy} from "natural-orderby"
import {onMount} from "solid-js"


//####################################################################################################################//
//##>  Exports                                                                                                      ##//
//####################################################################################################################//

	export function Client(){
		onMount(async ()=>{
			const rootURL = document.location.origin

			const params = new URLSearchParams(document.location.search)
			const code   = params.get("code")

			window.history.pushState(null, "", rootURL)

			const $Page: $Page = {
				Download: document.getElementById("Download"),
				Info:     document.getElementById("Info"    ),
				Retry:    document.getElementById("Retry"   ),
				Spinner:  document.getElementById("Spinner" ),
			}

			const SpotifyData = await fetch(".netlify/functions/get_Spotify_Credentials")
			const Spotify     = (await SpotifyData.json() as Spotify)

			if(code)
				{await flow_App({$Page, Spotify, rootURL, code})}
			else
				{flow_Login({$Page, Spotify, rootURL})}
		})

		return null
	}


//####################################################################################################################//
//##>  Types                                                                                                        ##//
//####################################################################################################################//

	type $Page = {
		Download: HTMLButtonElement
		Info:     HTMLDivElement
		Retry:    HTMLButtonElement
		Spinner:  HTMLDivElement
	}

	type Spotify = {
		ClientID:     string
		ClientSecret: string
	}


//####################################################################################################################//
//##>  Utilities                                                                                                    ##//
//####################################################################################################################//

	const RegEx = {
		StartsWith_Alphanumeric: /^[A-Za-z0-9]/
	} as const

	function flow_Login(
		{$Page,       Spotify,         rootURL       }:
		{$Page:$Page, Spotify:Spotify, rootURL:string}
	){
		const scopes = "user-follow-read"; // Add any additional scopes required

		const params = new URLSearchParams()
		params.append("response_type", "code"          )
		params.append("client_id",     Spotify.ClientID)
		params.append("scope",         scopes          )
		params.append("redirect_uri",  rootURL         )

		const authorizeUrl = `https://accounts.spotify.com/authorize?${params}`
		window.location.replace(authorizeUrl)
	}

	async function flow_App(
		{$Page,       Spotify,         rootURL,        code       }:
		{$Page:$Page, Spotify:Spotify, rootURL:string, code:string}
	){
		let response: Response

		try{
			const params = new URLSearchParams()
			params.append("grant_type",   "authorization_code")
			params.append("code",         code                )
			params.append("redirect_uri", rootURL             )

			const auth =
				Buffer
				.from(`${Spotify.ClientID}:${Spotify.ClientSecret}`)
				.toString("base64")

			// Exchange the authorization code for an access token
			response = await fetch("https://accounts.spotify.com/api/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `Basic ${auth}`,
				},
				body: params.toString(),
			});

			const data: any = await response.json();

			if (!response.ok) {
				throw new Error(`Error retrieving access token: ${data.error.message}`);
			}

			const accessToken = data.access_token;

			// Use the access token to make API requests
			const artists = await get_Artists(accessToken)

			// Display the followed artists
			const artistCount = artists.length
			const fileText    = artists.join("\n")

			$Page.Info.innerText =
				(artistCount === 1)
				? `${artistCount} followed artist found.`
				: `${artistCount} followed artists found.`

			$Page.Spinner.remove()

			set_Download_Action({fileName:"Spotify - Followed Artists.md", $Page, fileText})
			$Page.Download.classList.remove("Hidden")
		}
		catch(error){
			$Page.Info.innerText = [
				"Error encountered.",
				"See console for more details.",
			].join("\n")

			const errorLog = {
				stack: error.stack,
			}

			try{
				errorLog.response = await response.text()
			}
			catch{
			}

			const fileText = (""
				+ errorLog.stack
				+ "\n".repeat(8)
				+ (errorLog.response ?? "")
			)

			set_Download_Action({fileName:"Spotify - Followed Artists.error", $Page, fileText})
			$Page.Download.innerText = "Error Log"

			$Page.Spinner.remove()

			set_Retry_Action({$Page, rootURL})
			$Page.Download.classList.remove("Hidden")
			$Page.Retry   .classList.remove("Hidden")

			throw error
		}
	}

	async function get_Artists(accessToken:any) {
		const artists = [];
		let nextPage = "https://api.spotify.com/v1/me/following?type=artist&limit=50";

		while (nextPage) {
			const response = await fetch(nextPage, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});
			const data: any = await response.json();

			if (!response.ok) {
				throw new Error(`Error retrieving followed artists: ${data.error.message}`);
			}

			for (const artist of data.artists.items) {
				artists.push(artist.name);
			}

			nextPage = data.artists.next;
		}

		const sorted = sort_Artists(artists)

		return sorted
	}

	function sort_Artists(artists:string[]){
		const alphanumericArtists: string[] = []
		const otherArtists:        string[] = []

		for(const artist of artists){
			if(RegEx.StartsWith_Alphanumeric.exec(artist))
				{alphanumericArtists.push(artist)}
			else
				{otherArtists.push(artist)}
		}

		const sorted_Alphanumeric = orderBy(alphanumericArtists)
		const sorted_Other        = orderBy(otherArtists       )
		const sorted              = sorted_Other.concat(sorted_Alphanumeric)

		return sorted
	}

	function set_Download_Action(
		{$Page,       fileName,        fileText       }:
		{$Page:$Page, fileName:string, fileText:string}
	){
		$Page.Download.addEventListener("click", () => {
			const blob = new Blob([fileText], {type:"text/plain"})
			const url  = URL.createObjectURL(blob)

			const $Anchor    = document.createElement("a")
			$Anchor.download = fileName
			$Anchor.href     = url
			$Anchor.click()

			URL.revokeObjectURL(url)
			$Anchor.remove()
		})
	}

	function set_Retry_Action(
		{$Page,       rootURL       }:
		{$Page:$Page, rootURL:string}
	){
		$Page.Retry.addEventListener("click", () => {
			window.location.replace(rootURL)
		})
	}
