import plotly.graph_objects as go
import plotly.express as px
from pandas import DataFrame
import pandasql as ps
from plotly.subplots import make_subplots

from OpenAlumni.Tools import log


class StatGraph:

    #dash= dash.Dash(__name__)
    df:DataFrame
    fig=None

    def __init__(self,df:DataFrame):
        self.df=df

    def query(self,sql):
        self.df=ps.sqldf(sql)

    def trace(self,x,y,color,height,style="bar",title="",template="seaborn"):
        log("Elaboration du graph "+title+" de style "+style)
        if height is not None:height=int(height)
        if style=="none":
            self.fig=None

        if style=="none":
            self.fig=""

        if style=="bar100":
            self.fig = px.bar(self.df, x=x, y=y, color=color,height=height,template=template,title=title,text_auto=True)

        if style=="bar":
            if color!="undefined":
                self.fig = px.bar(self.df, x=x, y=y, color=color,height=height,template=template,title=title,text_auto=True)
            else:
                self.fig = px.bar(self.df, x=x, y=y,  height=height, template=template, title=title,text_auto=True)

        if style=="line":
            self.fig = px.line(self.df, x=x, y=y, color=color,height=height,template=template,title=title)

        if style=="aera":
            #https://plotly.com/python-api-reference/generated/plotly.express.area.html
            self.fig = px.area(self.df, x=x, y=y, color=color,height=height,template=template,title=title)

        if style=="pie":
            if color=="undefined": color=x
            if x==color:
                # camembert : https://plotly.com/python-api-reference/generated/plotly.express.pie.html
                self.fig = px.pie(self.df,color=color,height=height,names=x,values=y,template=template,title=title)
                self.fig.update_traces(textinfo="value")
            else:
                n_cols=4
                n_rows=int(len(set(self.df[x]))/n_cols)
                self.fig=make_subplots(rows=n_rows,cols=n_cols,specs=[[{'type':'domain'}]*n_cols]*n_rows)
                c=1
                r=1
                for col in set(self.df[x]):
                    rc=self.df.loc[self.df[x]==col]
                    del rc[x]
                    pie=go.Pie(values=list(rc[y]),labels=list(rc[color]),title=col)
                    self.fig.add_trace(pie,r,c)
                    c = c + 1
                    if c > n_cols:
                        c = 1
                        r = r + 1

                self.fig.update_traces(hoverinfo='label+percent+name', textinfo='none')

        log("Elaboration terminée")




        # self.dash.layout=html.Div(children=[
        #     html.H1(children='Hello Dash'),
        #     html.Div(children='''Dash: A web application framework for your data.'''),
        #     dcc.Graph(id='example-graph',figure=fig)
        # ])

    def to_html(self):
        """
        Présentation des données au format HTML
        documentation: https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_html.html
        :return:
        """
        code="" if self.fig is None else self.fig.to_html()
        #Formatage du tableau voir: https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_html.html
        return {"code": code,
                "values":self.df.to_html(
            justify="center",
            classes="detail_stat_format",
            render_links=True,
            border=0,
            bold_rows=False,
            col_space=20
        )}


