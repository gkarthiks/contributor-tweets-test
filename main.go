package main

import "github.com/ChimeraCoder/anaconda"

func main() {
	api := anaconda.NewTwitterApiWithCredentials("1306981627654885377-5u9yvX0tOj1WelajogwuMPZ72mCRUC", "MAAk59zqZHVXubYYcGkXysmZTfN7UPm5ICkteQzXCOeOR", "qMj2x8bciovWx3aAgOdxjvKof", "HgHRGIQE6P4dPvVTbggBrbRhWbODUGewuUpgDSWW1m3gZObIry")

	api.PostTweet("new tweet req", nil)

}
