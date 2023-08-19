//###  NPM  ###//
import {defineConfig} from "astro/config"
import Solid          from "@astrojs/solid-js"


//####################################################################################################################//
//##>  Exports                                                                                                      ##//
//####################################################################################################################//

	export default defineConfig({

		server: {
			port: 3000,
		},

		integrations: [
			Solid(),
		],

		vite: {
			server: {
				strictPort: true,
			},
		},

	})
