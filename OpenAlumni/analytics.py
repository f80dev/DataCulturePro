import plotly.graph_objects as go
import plotly.express as px
from pandas import DataFrame
import pandasql as ps
from plotly.subplots import make_subplots


class StatGraph:

    #dash= dash.Dash(__name__)
    df:DataFrame
    fig=None
    template="seaborn"

    def __init__(self,df:DataFrame):
        self.df=df

    def query(self,sql):
        self.df=ps.sqldf(sql)

    def trace(self,x,y,color,height,style="bar"):
        if height is not None:height=int(height)
        if style=="bar":
            self.fig = px.bar(self.df, x=x, y=y, color=color,height=height,template=self.template)

        if style=="pie":
            if x==color:
                self.fig = px.pie(self.df,color=color,height=height,names=x,values=y,template=self.template)
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





        # self.dash.layout=html.Div(children=[
        #     html.H1(children='Hello Dash'),
        #     html.Div(children='''Dash: A web application framework for your data.'''),
        #     dcc.Graph(id='example-graph',figure=fig)
        # ])

    def to_html(self):
        code=self.fig.to_html()
        return {"code": code,"values":self.df.to_html()}


