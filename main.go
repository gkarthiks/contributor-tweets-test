package main

import (
	"context"
	"fmt"
	//"github.com/ChimeraCoder/anaconda"
	"github.com/google/go-github/v32/github"
)

func main() {
	//api := anaconda.NewTwitterApiWithCredentials("1306981627654885377-5u9yvX0tOj1WelajogwuMPZ72mCRUC", "MAAk59zqZHVXubYYcGkXysmZTfN7UPm5ICkteQzXCOeOR", "qMj2x8bciovWx3aAgOdxjvKof", "HgHRGIQE6P4dPvVTbggBrbRhWbODUGewuUpgDSWW1m3gZObIry")
	//
	//api.PostTweet("new tweet req", nil)


	client := github.NewClient(nil)
	orgs, _, err := client.Organizations.List(context.Background(), "gkarthiks", nil)
	if err != nil {
		fmt.Printf("error occured: %v", err)
	} else {
		fmt.Println(orgs)
	}

	client.Issues.
}
